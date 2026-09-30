"""Classificador heurístico: UC, tipo, ano lectivo, avaliação, época, papel e tópicos.

Cada campo sai com valor, confiança, justificações (códigos i18n) e alternativas. Os
campos obrigatórios abaixo do limiar mandam o documento para "A rever"; nunca se arruma
à sorte. A IA (skill /rever-classificacoes) entra depois, sobre o que ficar ambíguo.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
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
from nexus.domain.text import contains_phrase, normalize
from nexus.domain.users import User
from nexus.domain.vocab import ROLE_SOLUTION, ROLE_STATEMENT, Term, Vocabularies
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
from nexus.pipeline.classify.signals import Signal, collect_signals
from nexus.pipeline.classify.units import UnitFeatures, compile_unit, score_units
from nexus.pipeline.classify.years import score_years

# Sobe quando a lógica muda de forma a justificar reclassificar o que não foi revisto.
CLASSIFIER_VERSION = 1

ROLE_PRIOR = 0.3
DEFAULT_STATEMENT_CONFIDENCE = 0.9
ASSESSMENT_BOOST = 0.5
CODE_PROJECT_BOOST = 1.5
FORMAT_BOOST = 1.5
_NUMBER_RE = re.compile(
    r"\b(?:mini teste|miniteste|teste|frequencia|exame|trabalho|projeto|ficha|tp)"
    r" (?:n )?(\d{1,2})\b|\b(\d{1,2}) o (?:mini teste|teste|frequencia|trabalho)\b"
)


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

        result.unit = kept("unit") or self._unit(signals, owner)
        role_field, solution_score = self._role(signals)
        if kept("role") is not None:
            role_field = kept("role")
        doc_type, is_assessment = self._document_type(signals, role_field, doc.kind,
                                                      doc.blob.ext)
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
        found = proposals.detect(pages, self.catalog) if pages else []
        return Outcome(result, weak, found)

    def weak_fields(self, result: Classification, type_term: Term | None) -> list[str]:
        required = list(self.settings.required_fields)
        if type_term is not None and type_term.is_assessment:
            required += [f for f in self.settings.required_for_assessments if f not in required]
        threshold = self.settings.auto_file_threshold
        weak: list[str] = []
        for name in required:
            value: FieldValue | None = getattr(result, name)
            if value is None or value.value is None or (
                not value.is_user and value.confidence < threshold
            ):
                weak.append(name)
        return weak

    # --- campos ---------------------------------------------------------------------

    def _unit(self, signals: list[Signal], owner: User | None) -> FieldValue | None:
        prior = self.settings.prior
        boost = self.settings.enrollment_boost
        enrolled: set[str] = set()
        if owner is not None:
            enrolled = owner.enrollments.unit_keys()
            for course_key in owner.enrollments.courses:
                course = self.catalog.courses.get(course_key)
                if course is not None:
                    enrolled |= {f"{course.institution}/{link.unit}" for link in course.units}
        if enrolled:
            mine = [u for u in self.units if u.unit.key in enrolled]
            ranked = score_units(mine, signals, enrolled, boost)
            if ranked and confidence(ranked, prior) >= self.settings.auto_file_threshold:
                return to_field(ranked, prior)
        ranked = score_units(self.units, signals, enrolled, boost)
        result = to_field(ranked, prior)
        if result is not None and enrolled and result.value not in enrolled:
            result.reasons = [*result.reasons, Reason(code="unit.not_enrolled")]
        return result

    def _role(self, signals: list[Signal]) -> tuple[FieldValue | None, float]:
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
        self, signals: list[Signal], role: FieldValue | None, kind: DocumentKind, ext: str
    ) -> tuple[FieldValue | None, bool]:
        """Agrupa tipos com as mesmas palavras-chave em famílias; escolhe a família e,
        dentro dela, o membro pelo papel (enunciado/resolução)."""
        prior = self.settings.prior
        families: dict[Any, list[CompiledTerm]] = {}
        for compiled in self.doc_types:
            if compiled.term.is_fallback:
                continue
            families.setdefault(compiled.family_key, []).append(compiled)
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
            role_conf = role.confidence if role is not None else DEFAULT_STATEMENT_CONFIDENCE
            reason = Reason(code="type.role_solution" if wanted == ROLE_SOLUTION
                            else "type.role_statement")
            return match, role_conf, [reason]

        best_members = families[ranked[0].value]
        term, role_conf, extra = pick(best_members)
        alternatives: list[Alternative] = []
        for sibling in best_members:
            if sibling.term.slug != term.slug:
                alternatives.append(Alternative(
                    value=sibling.term.slug, confidence=round(family_conf * (1 - role_conf), 3)))
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
            match = _NUMBER_RE.search(signal.norm)
            if match:
                number = int(match.group(1) or match.group(2))
                return FieldValue(value=number, confidence=0.8, reasons=[Reason(
                    code="number.pattern", params={"text": match.group(0)},
                    source=signal.source)])
        return None

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
