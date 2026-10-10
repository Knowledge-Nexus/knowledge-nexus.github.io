"""Detecção de cadeiras, cursos e instituições que ainda não estão no catálogo.

Duas fontes, sempre com o excerto como evidência:
- cabeçalhos típicos ("Unidade Curricular: …", "Licenciatura em …", "Universidade de …");
- siglas das pastas e dos nomes dos ficheiros (ex.: `ED/…`, `IPRP_Teste1.pdf`) que
  coincidem com as iniciais de uma frase do início do documento ("Estruturas Discretas",
  "Introdução à Programação e Resolução de Problemas"). É assim que as pessoas arrumam o
  material, e a coincidência de iniciais é um indício forte. Nada disto é fixo no código:
  as siglas e os nomes vêm do material.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from functools import cache

from nexus.domain.catalog import Catalog
from nexus.domain.proposals import ProposalKind
from nexus.domain.text import (
    contains_phrase,
    contains_unit_phrase,
    fix_spacing_accents,
    normalize,
    roman,
    sequel_after,
    series_number,
)
from nexus.pipeline import layout

_SEP = r"\s*[:\-–—]\s*"
# "Unidade Curricular: X", "Disciplina - X": o documento diz de que cadeira é.
UNIT_LABEL_RE = _UNIT_RE = re.compile(
    r"(?im)\b(?:unidade\s+curricular|u\.\s?c\.|disciplina|cadeira)" + _SEP + r"([^\n|]{3,80})"
)
_COURSE_RE = re.compile(
    r"(?im)\b(licenciatura|mestrado(?:\s+integrado)?|doutoramento|ctesp|"
    r"p[oó]s[\s-]?gradua[cç][aã]o|especializa[cç][aã]o|"
    r"curso\s+t[eé]cnico\s+superior\s+profissional)\s+em\s+([^\n,;|()]{3,80})"
)
# "36.º CURSO DE FORMAÇÃO PARA OS TRIBUNAIS JUDICIAIS" (concursos, formações profissionais).
_TRAINING_RE = re.compile(
    r"(?im)\bcurso\s+de\s+forma[cç][aã]o\s+((?:para|de|em)\s+[^\n,;|()\d]{3,80})"
)
_INSTITUTION_RE = re.compile(
    r"(?im)\b((?:universidade|instituto\s+(?:superior|polit[eé]cnico)|escola\s+superior|"
    r"faculdade|centro\s+de\s+estudos)\b[^\n,;|()]{0,80})"
)
# Título de uma prova: "PROVA ESCRITA DE DIREITO PENAL E DIREITO PROCESSUAL PENAL Via…".
# Sensível a maiúsculas: "a prova de que…" (no meio do texto) não é o nome de uma cadeira.
_EXAM_TITLE_RE = re.compile(
    r"\b(?:PROVA|Prova)\s+(?:(?:ESCRITA|Escrita|escrita|ORAL|Oral|oral)\s+)?(?:DE|de)\s+"
    r"([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n(\d–—,;:]{3,90})"
)
_EXAM_TITLE_CUT = re.compile(
    r"(?i)\s+(via|aviso|data|dura[cç][aã]o|grelha|[1-9]\S*\s+chamada)\b.*$")
_TRAILING = re.compile(
    r"(\s+-\s+.*|\s{2,}.*|\s+(ano\s+le[c]?tivo|[ée]poca|data|exame|teste|frequ[êe]ncia)\b.*"
    r"|\s*\d{4}\s*[/-]\s*\d{2,4}.*)$",
    re.IGNORECASE,
)


_STOPWORDS = {"de", "da", "do", "das", "dos", "e", "a", "à", "o", "os", "as", "ao", "aos", "às",
              "em", "para", "com", "na", "no", "nas", "nos", "pelo", "pela", "pelos", "pelas",
              "por", "of", "and", "the", "in", "for", "to", "y", "del", "la", "el", "et", "des",
              "du", "le", "les", "und", "der", "die"}
_INSTITUTION_WORDS = {"universidade", "instituto", "escola", "faculdade", "politecnico",
                      "university", "universidad", "college", "school", "centro", "academia",
                      "conservatorio"}
# Graus e cursos: uma "cadeira" que comece assim é na verdade um curso.
_DEGREE_WORDS = {"licenciatura", "mestrado", "doutoramento", "ctesp", "curso", "bacharelato",
                 "pos", "posgraduacao", "especializacao"}
_PUBLISHER_RE = re.compile(r"(?i)\b(editora|edi[cç][oõ]es|press|livraria|publishing)\b")
# "Universidade dede Coimbra": sílabas repetidas são erros de OCR.
_STUTTER_RE = re.compile(r"(?i)\b(\w{2,})\1\b")
_ACRONYM_RE = re.compile(r"^[A-Za-z]*[A-Z][A-Za-z]*[A-Z][A-Za-z]*$")
_WORD_RE = re.compile(r"[^\W\d_][^\W_]*", re.UNICODE)
_BAD_NAME_RE = re.compile(r"[/\\`|<>=\[\]{}()~•_*#@]|\.\w{2,4}\b|\d{3,}")
# OCR: palavras coladas ("apósGestão") ou partidas ("J Udiciários").
_BROKEN_RE = re.compile(r"[a-zà-ÿ][A-ZÀ-Ý]|\b[A-ZÀ-Ý] [A-ZÀ-Ý][a-zà-ÿ]|[a-zà-ÿ]\d")
# Nomes que são só o tipo de instituição, sem dizer qual ("Centro de Estudos", "Faculdade").
_INSTITUTION_HEADS = {"universidade", "instituto", "instituto superior", "instituto politecnico",
                      "escola", "escola superior", "faculdade", "centro", "centro de estudos",
                      "academia", "conservatorio"}


@dataclass(frozen=True)
class ProposalCandidate:
    kind: ProposalKind
    name: str
    snippet: str
    page: int | None
    acronym: str | None = None


@cache
def first_names() -> frozenset[str]:
    """Nomes próprios comuns (config/nomes-proprios.txt), normalizados."""
    from nexus.config import config_dir

    path = config_dir() / "nomes-proprios.txt"
    if not path.exists():
        return frozenset()
    lines = path.read_text(encoding="utf-8").splitlines()
    return frozenset(normalize(x) for x in lines if x.strip() and not x.startswith("#"))


def _person(name: str) -> bool:
    """"Bárbara Magalhães Bravo": começa por um nome próprio e as outras palavras (fora as
    de ligação) têm maiúscula. É um autor, docente ou orientador, não uma cadeira."""
    words = name.split()
    if not 2 <= len(words) <= 6 or normalize(words[0]) not in first_names():
        return False
    return all(w[0].isupper() or w.lower() in _STOPWORDS for w in words)


def _kind_of(name: str, default: ProposalKind) -> ProposalKind:
    """Pela primeira palavra: "Licenciatura em …" é um curso, "Centro de Estudos …" uma
    instituição, mesmo que tenha sido encontrado como cadeira."""
    first = normalize(name).split(" ", 1)[0] if name else ""
    first = first.replace(" ", "")
    if first in _INSTITUTION_WORDS:
        return "institution"
    if first in _DEGREE_WORDS:
        return "course"
    return default


def is_junk(kind: ProposalKind, name: str, generic: frozenset[str] = frozenset()) -> bool:
    """Uma proposta que as regras actuais já não criariam: termo genérico, pessoa, ruído de
    OCR, ou do tipo errado ("Licenciatura em …" proposta como cadeira)."""
    return not acceptable(name, generic) or _kind_of(name, kind) != kind


def _strip_connectors(name: str) -> str:
    """"Escola Superior de Tecnologia e Gestão de" → "… e Gestão"."""
    words = name.split()
    while words and words[-1].lower() in _STOPWORDS:
        words.pop()
    return " ".join(words)


def acceptable(name: str, generic: frozenset[str] = frozenset()) -> bool:
    """Pode ser o nome de uma cadeira, curso ou instituição: não é um termo genérico do
    ensino, uma pessoa, uma editora nem texto estragado pelo OCR."""
    norm = normalize(name)
    return (_plausible_name(name) and norm not in generic and norm not in _INSTITUTION_HEADS
            and not _person(name) and not _PUBLISHER_RE.search(name)
            and not _STUTTER_RE.search(name) and not _BROKEN_RE.search(name))


def _institution_name(name: str) -> str:
    """O nome próprio de uma instituição acaba na primeira palavra minúscula que não seja de
    ligação: "Centro de Estudos Judiciários o tempo de duração…" → "… Judiciários"; e na
    primeira frase: "Universidade do Minho. Professor…" → "Universidade do Minho"."""
    name = re.split(r"\.\s", name, maxsplit=1)[0]
    kept: list[str] = []
    for word in name.split():
        if word[0].islower() and word.lower() not in _STOPWORDS:
            break
        kept.append(word)
    return " ".join(kept)


def _plausible_name(name: str) -> bool:
    """Um nome de cadeira/curso/instituição, não um caminho, listagem ou frase solta."""
    words = name.split()
    letters = sum(ch.isalpha() for ch in name)
    return (2 <= len(name) <= 90 and 1 <= len(words) <= 12 and name[0].isalpha()
            and not _BAD_NAME_RE.search(name) and letters >= 0.75 * len(name.replace(" ", "")))


def path_acronyms(paths: list[str], folders_only: bool = False) -> list[str]:
    """Siglas candidatas: pastas e partes do nome dos ficheiros com 2–8 letras e pelo menos
    duas maiúsculas (UC, ED, IPRP, LEI…). Com `folders_only`, só os nomes das pastas: as
    siglas soltas nos nomes dos ficheiros são muitas vezes assuntos (DNS, IPC), não cadeiras."""
    found: list[str] = []
    for path in paths:
        parts = path.replace("!/", "/").split("/")
        tokens = [*parts[:-1]] if folders_only else \
            [*parts[:-1], *re.split(r"[^A-Za-z]+", parts[-1].rsplit(".", 1)[0])]
        for token in tokens:
            token = token.strip()
            if 2 <= len(token) <= 8 and _ACRONYM_RE.match(token) and token.upper() == token \
                    and token not in found:
                found.append(token)
    return found


def _phrases_with_initials(text: str, acronym: str) -> list[tuple[str, int, int]]:
    """Sequências de palavras cujas iniciais das palavras "cheias" formam `acronym`."""
    words = list(_WORD_RE.finditer(text))
    target = acronym.upper()
    out: list[tuple[str, int, int]] = []
    for start in range(len(words)):
        first = words[start].group()
        if first.lower() in _STOPWORDS or not first[0].isupper():
            continue
        initials = ""
        for end in range(start, min(len(words), start + 2 * len(target) + 2)):
            word = words[end].group()
            if word.lower() in _STOPWORDS:
                continue
            if not word[0].isupper() or len(word) < 3:
                break  # "Estruturas Discretas D": a letra da versão não é uma palavra
            initials += word[0].upper()
            if not target.startswith(initials):
                break
            if initials == target:
                span = text[words[start].start():words[end].end()]
                out.append((" ".join(span.split()), words[start].start(), words[end].end()))
                break
    return out


def _title(name: str) -> str:
    """"ESTRUTURAS DISCRETAS" → "Estruturas Discretas". Mantém o que já vem misturado (só
    as palavras de ligação passam a minúsculas) e as siglas até 3 letras ("DIREITO DA UE" →
    "Direito da UE")."""
    if name.upper() != name:
        return " ".join(w.lower() if w.lower() in _STOPWORDS and i else w
                        for i, w in enumerate(name.split()))
    out = []
    for i, word in enumerate(name.split()):
        low = word.lower()
        if i and low in _STOPWORDS:
            out.append(low)
        elif len(word) <= 3 and word.isalpha() and i:
            out.append(word)  # sigla
        else:
            out.append(word.capitalize())
    return " ".join(out)


def _clean(value: str) -> str:
    value = _TRAILING.sub("", value.strip())
    return value.strip(" .:-–—").strip()


def _snippet(text: str, start: int, end: int) -> str:
    return " ".join(text[max(0, start - 40) : min(len(text), end + 40)].split())


def _known(catalog: Catalog, kind: ProposalKind, name: str) -> bool:
    norm = normalize(name)
    if not norm:
        return True
    if kind == "unit":
        names = [n for u in catalog.units.values() for n in (u.name, *u.aliases)]
    elif kind == "course":
        names = [c.name for c in catalog.courses.values()]
    else:
        names = [n for i in catalog.institutions.values()
                 for n in (i.name, i.acronym or "", *i.aliases)]
    match = contains_unit_phrase if kind == "unit" else contains_phrase
    for known in names:
        known_norm = normalize(known)
        if known_norm and (match(norm, known_norm) or match(known_norm, norm)):
            return True
    return False


_TRAILING_NUMBER = re.compile(r"[\s_.-]*(?:[0-9]+|[IVXivx]+)$")


def _without_number(value: str) -> str:
    """"Análise Matemática II" → "Análise Matemática"; "AM1" → "AM" (só se tiver número)."""
    if series_number(normalize(value)) is None:
        return value
    return _TRAILING_NUMBER.sub("", value).strip() or value


_ROMAN_AFTER = r"[\s_.-]*(?:II|III|IV|V|VI|VII|VIII|IX|X)(?![A-Za-z0-9])"


def _sequel_texts(paths: list[str], forms: list[str]) -> list[str]:
    """Onde procurar a continuação: os nomes das pastas, e os nomes dos ficheiros só quando a
    forma vem seguida de numeração romana ("Sebenta_AM_II"). "TC3_Gramáticas.pdf" é o
    capítulo 3, não uma cadeira "Teoria da Computação III"."""
    out: list[str] = []
    for path in paths:
        parts = path.replace("!/", "/").split("/")
        out.extend(parts[:-1])
        filename = parts[-1]
        for form in forms:
            pattern = r"[\s_.-]+".join(re.escape(w) for w in form.split())
            if re.search(rf"(?i:(?<![A-Za-z]){pattern}){_ROMAN_AFTER}", filename):
                out.append(filename)
                break
    return out


def _sequels(paths: list[str], catalog: Catalog) -> list[ProposalCandidate]:
    """Outra cadeira da mesma série: "Análise Matemática II" (ou "AM_II") quando o catálogo
    só tem "Análise Matemática" ou "Análise Matemática I". Mesmo nome, outro número; são as
    pastas ou o nome do ficheiro que o dizem."""
    out: list[ProposalCandidate] = []
    for unit in catalog.units.values():
        own = series_number(normalize(unit.name)) or 1
        base = _without_number(unit.name)
        acronym = _without_number(unit.acronym) if unit.acronym else None
        forms = [f for f in (base, *map(_without_number, unit.aliases), acronym) if f]
        for original in _sequel_texts(paths, forms):
            text = normalize(original)
            number = next((n for f in forms if (n := sequel_after(text, normalize(f)))), None)
            if number is None or number == own:
                continue
            name = f"{base} {roman(number)}"
            if _known(catalog, "unit", name):
                continue
            out.append(ProposalCandidate(
                "unit", name, " ".join(original.split())[:160], None,
                f"{acronym} {roman(number)}" if acronym else None))
            break
    return out


def unsupported_sequel(name: str, paths: list[str], catalog: Catalog) -> bool:
    """`name` é uma continuação de uma cadeira do catálogo ("X II") que as pastas e nomes
    dos documentos que a originaram já não justificam (era um capítulo ou um ano)."""
    norm = normalize(name)
    if series_number(norm) is None:
        return False
    base = normalize(_without_number(name))
    if not any(normalize(_without_number(u.name)) == base for u in catalog.units.values()):
        return False
    return not any(normalize(c.name) == norm for c in _sequels(paths, catalog))


def _known_acronym(catalog: Catalog, kind: ProposalKind, acronym: str) -> bool:
    """A sigla já é de alguma coisa do catálogo (de qualquer tipo: "UC" é a instituição, não
    serve para inventar uma cadeira "Usados Como")."""
    values = [v for u in catalog.units.values() for v in (u.acronym, u.code, u.slug) if v]
    values += [v for i in catalog.institutions.values() for v in (i.acronym, i.slug) if v]
    values += [c.slug for c in catalog.courses.values()]
    return any(normalize(v) == normalize(acronym) for v in values)


def folder_units(paths: list[str], catalog: Catalog,
                 generic: frozenset[str] = frozenset()) -> list[ProposalCandidate]:
    """Cadeiras das pastas da organização da origem que ainda não estão no catálogo."""
    out: dict[str, ProposalCandidate] = {}
    for path in paths:
        found = layout.parse(path)
        if found is None or not acceptable(found.unit, generic) \
                or _known(catalog, "unit", found.unit):
            continue
        out.setdefault(normalize(found.unit), ProposalCandidate(
            "unit", found.unit, found.unit_folder, None))
    return list(out.values())


# Parte de um caminho que é um ficheiro (ex.: o arquivo em "IPRP.rar!/IPRP/…").
_FILE_PART = re.compile(r"\.[A-Za-z0-9]{1,5}$")


def folder_subjects(sources: list[tuple[str | None, str]], text: str, catalog: Catalog,
                    generic: frozenset[str] = frozenset(),
                    is_material: Callable[[str], bool] | None = None
                    ) -> list[ProposalCandidate]:
    """Fora da organização da origem: a pasta onde está o ficheiro (a mais funda que não é de
    material), quando o nome dela também aparece no nome do ficheiro ou no início do texto
    ("Direito Administrativo/manual direito administrativo.pdf"). Pede duas palavras com
    significado, pelo menos: "Penal", "Orais" ou "CEJUR" sozinhos são abreviaturas, provas
    ou entidades. `sources`: (lote, caminho) de cada origem."""
    out: dict[str, ProposalCandidate] = {}
    for batch, path in sources:
        if layout.parse(layout.full_path(batch, path)) is not None:
            continue
        parts = [p for p in path.replace("!/", "/").split("/") if p]
        if len(parts) < 2:
            continue
        folders = parts[:-1]
        folder = next((f for f in reversed(folders) if not _FILE_PART.search(f)
                       and not (is_material is not None and is_material(f))), None)
        if folder is None:
            continue
        name = " ".join(folder.split())
        norm = normalize(name)
        words = [w for w in norm.split() if w not in _STOPWORDS]
        evidence = f"{normalize(parts[-1].rsplit('.', 1)[0])} {normalize(text)}"
        if len(words) < 2 or not acceptable(name, generic) or _known(catalog, "unit", name) \
                or not contains_phrase(evidence, norm):
            continue
        out.setdefault(norm, ProposalCandidate("unit", name, "/".join(folders), None))
    return list(out.values())


def detect(pages: list[str], catalog: Catalog, max_pages: int = 2,
           paths: list[str] | None = None,
           generic: frozenset[str] = frozenset()) -> list[ProposalCandidate]:
    """Cadeiras, cursos e instituições que o material refere e que ainda não estão no
    catálogo. `generic`: termos (normalizados) que nunca são nomes de cadeiras."""
    found: dict[tuple[str, str], ProposalCandidate] = {}
    pages = [fix_spacing_accents(p) for p in pages[:max_pages]]
    header = pages[0][:1500] if pages else ""

    def add(kind: ProposalKind, name: str, snippet: str, page: int | None,
            acronym: str | None = None) -> None:
        name = _strip_connectors(_title(name))
        kind = _kind_of(name, kind)
        if kind == "institution":
            name = _strip_connectors(_institution_name(name))
        if len(normalize(name)) < 3 or not acceptable(name, generic) \
                or _known(catalog, kind, name):
            return
        if acronym and _known_acronym(catalog, kind, acronym):
            return
        found.setdefault((kind, normalize(name)), ProposalCandidate(
            kind, name, snippet, page, acronym if kind != "course" else None))

    # Só pelas pastas e nomes dos ficheiros ("AM_II", "Análise Matemática II/"): no texto,
    # "Teoria da Computação 3" ou "Administração Pública III" são capítulos e anos.
    for candidate in _sequels(list(paths or []), catalog):
        add("unit", candidate.name, candidate.snippet, candidate.page, candidate.acronym)
    for acronym in path_acronyms(paths or [], folders_only=True):
        for phrase, start, end in _phrases_with_initials(header, acronym):
            add("unit", phrase, _snippet(header, start, end), 1, acronym)
    for match in _EXAM_TITLE_RE.finditer(header[:600]):
        subject = _EXAM_TITLE_CUT.sub("", _clean(match.group(1)))
        add("unit", subject, _snippet(header, match.start(), match.end()), 1)
    for number, text in enumerate(pages[:max_pages], start=1):
        for match in _UNIT_RE.finditer(text):
            add("unit", _clean(match.group(1)), _snippet(text, match.start(), match.end()),
                number)
        for match in _COURSE_RE.finditer(text):
            name = f"{match.group(1).strip().capitalize()} em {_title(_clean(match.group(2)))}"
            add("course", name, _snippet(text, match.start(), match.end()), number)
        for match in _TRAINING_RE.finditer(text):
            name = f"Curso de Formação {_title(_clean(match.group(1)))}"
            add("course", name, _snippet(text, match.start(), match.end()), number)
        for match in _INSTITUTION_RE.finditer(text):
            add("institution", _clean(match.group(1)),
                _snippet(text, match.start(), match.end()), number)
    return list(found.values())
