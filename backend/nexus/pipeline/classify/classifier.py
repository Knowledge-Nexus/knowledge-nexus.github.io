"""Classificador heurístico: UC, tipo, ano lectivo, avaliação, época, papel e tópicos.

Cada campo sai com valor, confiança, justificações (códigos i18n) e alternativas. Os
campos obrigatórios abaixo do limiar mandam o documento para "A rever"; nunca se arruma
à sorte. A IA (skill /rever-classificacoes) entra depois, sobre o que ficar ambíguo.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field, replace
from typing import Any

from nexus.config import ClassificationSettings
from nexus.domain.catalog import Catalog
from nexus.domain.documents import (
    Alternative,
    Classification,
    Document,
    DocumentKind,
    FieldValue,
    Reason,
)
from nexus.domain.extraction import ExtractionMeta
from nexus.domain.text import (
    contains_phrase,
    contains_unit_phrase,
    fix_spacing_accents,
    normalize,
)
from nexus.domain.users import User
from nexus.domain.vocab import ROLE_SOLUTION, ROLE_STATEMENT, Term, Vocabularies
from nexus.pipeline import layout
from nexus.pipeline.classify import proposals
from nexus.pipeline.classify.scoring import (
    Candidate,
    CompiledTerm,
    compile_terms,
    confidence,
    rank,
    score_term,
    score_terms,
    to_field,
)
from nexus.pipeline.classify.signals import Signal, _signal, collect_signals
from nexus.pipeline.classify.units import UnitFeatures, compile_unit, score_units
from nexus.pipeline.classify.years import score_dates, score_years

# Sobe quando a lógica muda de forma a justificar reclassificar o que não foi revisto.
# 2: enunciado/resolução decidido só pelo nome, pastas, metadados e título (as primeiras
#    palavras da página 1); abreviaturas nos vocabulários (res_, corr_, fre1…).
# 3: data e versão (A/B…) das provas; "Primeira Frequência" → número 1.
# 5: organização da origem (<ano>/<semestre>/<cadeira>/…) e pastas de tipo de material.
# 6: siglas só como siglas ("SO" ≠ "só"); todas as cadeiras competem (a inscrição é bónus);
#    cadeira só no corpo do texto não chega; programa que criou o PDF; tipo com `type_prior`.
# 7: a pasta da cadeira que nomeia outra impede arrumar sozinho; pastas neutras.
# 8: cadeira só no texto (cabeçalho ou corpo, sem nome, pastas nem metadados) não chega; a
#    pasta da cadeira tem de conter o nome dela ("Programação" não é "Programação Orientada a
#    Objectos").
CLASSIFIER_VERSION = 8
# Palavras do início da página 1 que contam como título para decidir o papel.
ROLE_TITLE_WORDS = 40

ROLE_PRIOR = 0.3
# Certeza máxima de uma cadeira que só aparece no texto ou que a pasta da cadeira contradiz
# (abaixo do limiar).
BODY_ONLY_MAX = 0.6
DEFAULT_STATEMENT_CONFIDENCE = 0.9
ASSESSMENT_BOOST = 0.5
CODE_PROJECT_BOOST = 1.5
FORMAT_BOOST = 1.5
_NUMBER_RE = re.compile(
    r"\b(?:mini teste|miniteste|teste|frequencia|exame|trabalho|projeto|ficha|tp)"
    r" (?:n )?(\d{1,2})\b|\b(\d{1,2}) [oa] (?:mini teste|teste|frequencia|trabalho)\b"
)
_ORDINALS = {"primeir": 1, "segund": 2, "terceir": 3, "quart": 4, "quint": 5}
_ORDINAL_RE = re.compile(r"\b(primeir|segund|terceir|quart|quint)[oa] "
                         r"(?:mini teste|teste|frequencia|exame|trabalho)\b")
# Versão/turno da prova: "Teste 1A", "Exame de Recurso B", "Versão C", "<cadeira> D".
_VARIANT_RE = re.compile(
    r"\b(?:Teste|Exame|Frequ[êe]ncia|Prova|Mini-?teste)(?:\s+de\s+Recurso|\s+Recurso)?"
    r"\s*\d{0,2}\s*([A-F])(?![\w.])"
    r"|\b(?:Vers[ãa]o|Tipo|Variante|Modelo|Turno)\s+([A-Z0-9]{1,2})\b")


def _producer(meta: ExtractionMeta | None) -> str:
    """Programa que criou o PDF (metadados creator/producer), em minúsculas."""
    if meta is None:
        return ""
    return " ".join(meta.metadata.get(k, "") for k in ("creator", "producer")).lower()


def material_folder(vocab: Vocabularies) -> Callable[[str], bool]:
    """Uma pasta é de tipo de material quando o nome corresponde a um tipo de documento do
    vocabulário ("Material Prático", "Teóricas", "Testes"…)."""
    terms = compile_terms(vocab.document_types)
    neutral = {normalize(n) for n in vocab.neutral_folders}

    def check(name: str) -> bool:
        if normalize(name) in neutral:
            return True
        signal = _signal("path", name, 1.0)
        return signal is not None and bool(score_terms(terms, [signal]))
    return check


@dataclass
class Outcome:
    classification: Classification
    weak_fields: list[str] = field(default_factory=list)
    proposals: list[proposals.ProposalCandidate] = field(default_factory=list)


class Classifier:
    def __init__(
        self, vocab: Vocabularies, catalog: Catalog, settings: ClassificationSettings
    ) -> None:
        self.vocab = vocab
        self.catalog = catalog
        self.settings = settings
        self.units = [compile_unit(u) for u in catalog.units.values()]
        self.doc_types = compile_terms(vocab.document_types)
        self.roles = compile_terms(vocab.roles)
        self.assessment_types = compile_terms(vocab.assessment_types)
        self.seasons = compile_terms(vocab.exam_seasons)
        self.origins = compile_terms(vocab.solution_origins)
        # Termos que nunca são nomes de cadeiras: os genéricos e as palavras-chave do vocabulário.
        self.generic = frozenset(
            normalize(t) for t in [
                *vocab.generic_terms,
                *(k for kind in (vocab.document_types, vocab.assessment_types, vocab.roles,
                                 vocab.exam_seasons, vocab.solution_origins)
                  for term in kind for k in term.keywords),
            ]
        )
        self.is_material = material_folder(vocab)

    # --- API ------------------------------------------------------------------------

    def classify(
        self,
        doc: Document,
        meta: ExtractionMeta | None,
        pages: list[str],
        owner: User | None,
        archive_names: list[str],
        fixed: Classification | None = None,
    ) -> Outcome:
        """`fixed`: classificação actual; os campos definidos pelo utilizador ou pela IA
        condicionam os campos dependentes (ex.: tipo de avaliação só se o tipo o for)."""
        signals = collect_signals(doc, meta, pages, self.settings, archive_names)
        prior = self.settings.prior
        result = Classification()

        def kept(name: str) -> FieldValue | None:
            value: FieldValue | None = getattr(fixed, name) if fixed is not None else None
            return value if value is not None and value.method != "heuristic" else None

        folders = [parsed.unit for s in doc.sources
                   if (parsed := layout.parse(layout.full_path(s.batch, s.path)))]
        result.unit = kept("unit") or self._unit(signals, owner, folders)
        role_field, solution_score = self._role(signals, self._unit_names(result.unit))
        if kept("role") is not None:
            role_field = kept("role")
        doc_type, is_assessment = self._document_type(signals, role_field, doc.kind,
                                                      doc.blob.ext, _producer(meta))
        if kept("document_type") is not None:
            doc_type = kept("document_type")
        result.document_type = doc_type
        type_term = self.vocab.get("document_types", doc_type.value if doc_type else None)
        is_assessment = bool(type_term and type_term.is_assessment)

        if type_term is not None and type_term.role != "any" and doc_type is not None:
            result.role = FieldValue(
                value=type_term.role,
                confidence=role_field.confidence if role_field else DEFAULT_STATEMENT_CONFIDENCE,
                reasons=role_field.reasons if role_field else [
                    Reason(code="role.default_statement")],
            )
        elif role_field is not None and role_field.value == ROLE_SOLUTION:
            result.role = role_field

        result.academic_year = to_field(
            score_years(signals, self.settings.academic_year_start_month), prior)

        if is_assessment:
            result.assessment_type = to_field(score_terms(self.assessment_types, signals), prior)
            result.exam_season = to_field(score_terms(self.seasons, signals), prior)
            result.assessment_number = self._number(signals)
            result.date = score_dates(signals)
            result.variant = self._variant(pages, result.unit)

        if result.role is not None and result.role.value == ROLE_SOLUTION and solution_score > 0:
            origin = to_field(score_terms(self.origins, signals), prior)
            fallback = self.vocab.fallback("solution_origins")
            if origin is None and fallback is not None:
                origin = FieldValue(value=fallback.slug, confidence=0.3,
                                    reasons=[Reason(code="origin.unknown")])
            result.solution_origin = origin

        if result.unit is not None:
            result.topics = self._topics(result.unit.value, signals)

        weak = self.weak_fields(result, type_term)
        # Propostas de catálogo só a partir de documentos (nunca de listagens de arquivos
        # ou de projectos de código, que citam caminhos e tamanhos).
        found = proposals.detect(pages, self.catalog, paths=[s.path for s in doc.sources],
                                 generic=self.generic) \
            if pages and doc.kind is DocumentKind.FILE else []
        if doc.kind is DocumentKind.FILE and (result.unit is None or "unit" in weak):
            known = {normalize(c.name) for c in found}
            paths = [layout.full_path(s.batch, s.path) for s in doc.sources]
            header = pages[0][:self.settings.header_chars] if pages else ""
            for extra in (*proposals.folder_units(paths, self.catalog, self.generic),
                          *proposals.folder_subjects(
                              [(s.batch, s.path) for s in doc.sources], header, self.catalog,
                              self.generic, self.is_material)):
                if normalize(extra.name) not in known:
                    known.add(normalize(extra.name))
                    found.append(extra)
        return Outcome(result, weak, found)

    def weak_fields(self, result: Classification, type_term: Term | None) -> list[str]:
        threshold = self.settings.auto_file_threshold

        def weak(name: str) -> bool:
            value: FieldValue | None = getattr(result, name)
            return value is None or value.value is None or (
                not value.is_user and value.confidence < threshold)

        required = list(self.settings.required_fields)
        if self.type_to_confirm(result):
            # Arrumado na cadeira certa com o tipo por confirmar: o tipo (e o que só se exige
            # às avaliações) não prende o documento em "A rever".
            return [name for name in required if name != "document_type" and weak(name)]
        if type_term is not None and type_term.is_assessment:
            required += [f for f in self.settings.required_for_assessments if f not in required]
        return [name for name in required if weak(name)]

    def type_to_confirm(self, result: Classification) -> bool:
        """Opção `file_uncertain_type`: a cadeira é certa e só o tipo está em dúvida."""
        threshold = self.settings.auto_file_threshold
        unit, doc_type = result.unit, result.document_type
        return (self.settings.file_uncertain_type
                and unit is not None and unit.value is not None
                and (unit.is_user or unit.confidence >= threshold)
                and doc_type is not None and doc_type.value is not None
                and not doc_type.is_user and doc_type.confidence < threshold)

    # --- campos ---------------------------------------------------------------------

    def _unit(self, signals: list[Signal], owner: User | None,
              folders: list[str] | None = None) -> FieldValue | None:
        prior = self.settings.prior
        boost = self.settings.enrollment_boost
        enrolled: set[str] = set()
        if owner is not None:
            enrolled = owner.enrollments.unit_keys()
            for course_key in owner.enrollments.courses:
                course = self.catalog.courses.get(course_key)
                if course is not None:
                    enrolled |= {f"{course.institution}/{link.unit}" for link in course.units}
        # Todas as cadeiras competem; a inscrição só dá um bónus. (Antes, uma cadeira inscrita
        # com um sinal fraco, ex. nos metadados, ganhava sem olhar para a pasta da cadeira.)
        ranked = score_units(self.units, signals, enrolled, boost)
        result = to_field(ranked, prior)
        if result is None:
            return None
        if enrolled and result.value not in enrolled:
            result.reasons = [*result.reasons, Reason(code="unit.not_enrolled")]
        # Só no texto não chega para arrumar: um livro de Direito Administrativo fala de
        # "Administração Pública" logo na primeira página. Falta o apoio do nome do ficheiro,
        # das pastas ou dos metadados, ou um cabeçalho que diga "Unidade Curricular: X".
        sources = {r.source for r in result.reasons if r.source}
        if sources <= {"header", "body"} and result.confidence > BODY_ONLY_MAX \
                and not self._labelled(str(result.value), signals):
            result.confidence = BODY_ONLY_MAX
            code = "unit.body_only" if sources <= {"body"} else "unit.text_only"
            result.reasons = [*result.reasons, Reason(code=code)]
        # A pasta da cadeira (organização da origem) diz outra: não se arruma sozinho
        # ("AP" no nome do ficheiro era "avaliação periódica", não "Administração Pública").
        if folders and result.confidence > BODY_ONLY_MAX \
                and not self._matches_folder(str(result.value), folders):
            result.confidence = BODY_ONLY_MAX
            result.reasons = [*result.reasons, Reason(code="unit.other_folder",
                                                      params={"folder": folders[0]})]
        return result

    def _labelled(self, key: str, signals: list[Signal]) -> bool:
        """O cabeçalho diz qual é a cadeira ("Unidade Curricular: X", "Disciplina: X")."""
        unit = self.catalog.units.get(key)
        names = [n for n in (normalize(x) for x in (unit.name, *unit.aliases)) if n] \
            if unit is not None else []
        return any(contains_unit_phrase(normalize(match.group(1)), name)
                   for s in signals if s.source == "header"
                   for match in proposals.UNIT_LABEL_RE.finditer(s.text or s.raw)
                   for name in names)

    def _matches_folder(self, key: str, folders: list[str]) -> bool:
        unit = self.catalog.units.get(key)
        if unit is None:
            return False
        names = [normalize(n) for n in (unit.name, unit.acronym or "", unit.code or "",
                                        *unit.aliases) if n]
        # A pasta tem de conter o nome (ou um nome alternativo, sigla ou código): a pasta
        # "Programação" não diz "Programação Orientada a Objectos" (é outra cadeira).
        return any(n and contains_unit_phrase(normalize(f), n) for f in folders for n in names)

    def _unit_names(self, unit: FieldValue | None) -> list[str]:
        found = self.catalog.units.get(str(unit.value)) if unit and unit.value else None
        if found is None:
            return []
        return [n for n in (normalize(x) for x in (found.name, *found.aliases)) if n]

    def _role(self, signals: list[Signal], unit_names: list[str] | None = None
              ) -> tuple[FieldValue | None, float]:
        """Enunciado ou resolução. O texto das perguntas fala muitas vezes de "solução" ou
        "resolva", por isso só contam o nome, as pastas, os metadados e o título, e sem o
        nome da cadeira ("… e Resolução de Problemas" não é uma resolução)."""
        def clean(norm: str) -> str:
            text = f" {norm} "
            for name in unit_names or []:
                text = text.replace(f" {name} ", " ")
            return " ".join(text.split())

        signals = [
            replace(s, norm=clean(" ".join(s.norm.split()[:ROLE_TITLE_WORDS])
                                  if s.source == "header" else s.norm))
            for s in signals if s.source != "body"
        ]
        by_slug = {c.term.slug: c for c in self.roles}
        solution = score_term(by_slug[ROLE_SOLUTION], signals) if ROLE_SOLUTION in by_slug \
            else Candidate(ROLE_SOLUTION)
        statement = score_term(by_slug[ROLE_STATEMENT], signals) if ROLE_STATEMENT in by_slug \
            else Candidate(ROLE_STATEMENT)
        if solution.score > 0 and solution.score >= statement.score:
            conf = round(solution.score / (solution.score + statement.score + ROLE_PRIOR), 3)
            return FieldValue(value=ROLE_SOLUTION, confidence=conf, reasons=solution.reasons,
                              alternatives=[Alternative(value=ROLE_STATEMENT,
                                                        confidence=round(1 - conf, 3))]), \
                solution.score
        if statement.score > 0:
            conf = max(DEFAULT_STATEMENT_CONFIDENCE, round(
                statement.score / (statement.score + solution.score + ROLE_PRIOR), 3))
            return FieldValue(value=ROLE_STATEMENT, confidence=conf,
                              reasons=statement.reasons), solution.score
        return None, solution.score

    def _document_type(
        self, signals: list[Signal], role: FieldValue | None, kind: DocumentKind, ext: str,
        producer: str = "",
    ) -> tuple[FieldValue | None, bool]:
        """Agrupa tipos com as mesmas palavras-chave em famílias; escolhe a família e,
        dentro dela, o membro pelo papel (enunciado/resolução)."""
        prior = self.settings.type_prior if self.settings.type_prior is not None \
            else self.settings.prior
        # Cada família é identificada pelo slug do primeiro membro: os empates desempatam
        # por esse nome. (Desempatar pela chave da família, um frozenset, dependia da
        # semente de hash do Python e mudava o resultado de execução para execução.)
        families: dict[str, list[CompiledTerm]] = {}
        names: dict[Any, str] = {}
        for compiled in self.doc_types:
            if compiled.term.is_fallback:
                continue
            name = names.setdefault(compiled.family_key, compiled.term.slug)
            families.setdefault(name, []).append(compiled)
        assessment_signal = sum(
            r[0].score for r in (score_terms(self.assessment_types, signals),
                                 score_terms(self.seasons, signals)) if r
        )
        family_candidates: list[Candidate] = []
        for key, members in families.items():
            candidate = score_term(members[0], signals, value=key)
            if any(m.term.is_assessment for m in members) and assessment_signal > 0:
                candidate.add(min(assessment_signal, 4.0) * ASSESSMENT_BOOST,
                              Reason(code="type.assessment_signals"))
            if kind is DocumentKind.CODE_PROJECT and any(m.term.is_submission for m in members):
                candidate.add(CODE_PROJECT_BOOST, Reason(code="type.code_project"))
            if ext and any(ext in m.term.extensions for m in members):
                candidate.add(FORMAT_BOOST, Reason(code="type.format", params={"ext": ext}))
            made_with = next((p for m in members for p in m.term.producers
                              if producer and p.lower() in producer), None)
            if made_with:
                candidate.add(FORMAT_BOOST, Reason(code="type.producer",
                                                   params={"producer": made_with}))
            family_candidates.append(candidate)
        ranked = rank(family_candidates)
        if not ranked:
            fallback = self.vocab.fallback("document_types")
            if fallback is None:
                return None, False
            return FieldValue(value=fallback.slug, confidence=0.0,
                              reasons=[Reason(code="type.no_signal")]), False
        family_conf = confidence(ranked, prior)
        total = sum(c.score for c in ranked) + prior

        def pick(members: list[CompiledTerm]) -> tuple[Term, float, list[Reason]]:
            if len(members) == 1:
                return members[0].term, 1.0, []
            wanted = role.value if role is not None else ROLE_STATEMENT
            match = next((m.term for m in members if m.term.role == wanted), None)
            if match is None:
                match = next((m.term for m in members if m.term.role == "any"), members[0].term)
            # Sem nenhum sinal de enunciado nem de resolução, é um enunciado: não penaliza o
            # tipo (só as alternativas mostram a hipótese de ser a resolução).
            role_conf = role.confidence if role is not None else 1.0
            reason = Reason(code="type.role_solution" if wanted == ROLE_SOLUTION
                            else "type.role_statement")
            return match, role_conf, [reason]

        best_members = families[ranked[0].value]
        term, role_conf, extra = pick(best_members)
        alternatives: list[Alternative] = []
        for sibling in best_members:
            if sibling.term.slug != term.slug:
                doubt = 1 - (role.confidence if role is not None else DEFAULT_STATEMENT_CONFIDENCE)
                alternatives.append(Alternative(
                    value=sibling.term.slug, confidence=round(family_conf * doubt, 3)))
        for other in ranked[1:3]:
            other_term, _, _ = pick(families[other.value])
            alternatives.append(Alternative(value=other_term.slug,
                                            confidence=round(other.score / total, 3)))
        field_value = FieldValue(
            value=term.slug,
            confidence=round(family_conf * role_conf, 3),
            reasons=[*ranked[0].reasons, *extra],
            alternatives=alternatives,
        )
        return field_value, term.is_assessment

    def _number(self, signals: list[Signal]) -> FieldValue | None:
        for signal in signals:
            if signal.source not in {"filename", "header", "path"}:
                continue
            text = signal.norm[:400] if signal.source == "header" else signal.norm
            match = _NUMBER_RE.search(text)
            ordinal = _ORDINAL_RE.search(text)
            if match or ordinal:
                if match:
                    number, found = int(match.group(1) or match.group(2)), match.group(0)
                else:
                    assert ordinal is not None
                    number, found = _ORDINALS[ordinal.group(1)], ordinal.group(0)
                return FieldValue(value=number, confidence=0.8, reasons=[Reason(
                    code="number.pattern", params={"text": found}, source=signal.source)])
        return None

    def _variant(self, pages: list[str], unit: FieldValue | None) -> FieldValue | None:
        """Letra da versão da prova, no título da 1.ª página."""
        if not pages:
            return None
        title = " ".join(fix_spacing_accents(pages[0][:400]).split())
        match = _VARIANT_RE.search(title)
        value = (match.group(1) or match.group(2)) if match else None
        found = unit.value if unit else None
        if value is None and found and (u := self.catalog.units.get(str(found))):
            after = re.search(re.escape(u.name) + r"\s+([A-F])(?![\w.])", title)
            value = after.group(1) if after else None
        if not value:
            return None
        return FieldValue(value=value, confidence=0.7, reasons=[Reason(
            code="variant.found", params={"text": value}, source="header")])

    def _topics(self, unit_key: str, signals: list[Signal]) -> FieldValue | None:
        unit = self.catalog.units.get(unit_key)
        if unit is None or not unit.topics:
            return None
        found: list[str] = []
        reasons: list[Reason] = []
        for topic in (t for root in unit.topics for t in root.walk()):
            name = normalize(topic.name)
            for signal in signals:
                if signal.source in {"filename", "header", "path", "metadata"} and \
                        contains_phrase(signal.norm, name):
                    found.append(topic.slug)
                    reasons.append(Reason(code="topic.name", params={"value": topic.name},
                                          source=signal.source))
                    break
        if not found:
            return None
        return FieldValue(value=sorted(set(found))[:8], confidence=0.5, reasons=reasons)


def unit_features(catalog: Catalog) -> list[UnitFeatures]:
    return [compile_unit(u) for u in catalog.units.values()]
