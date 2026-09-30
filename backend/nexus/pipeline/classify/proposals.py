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
from dataclasses import dataclass

from nexus.domain.catalog import Catalog
from nexus.domain.proposals import ProposalKind
from nexus.domain.text import contains_phrase, fix_spacing_accents, normalize

_SEP = r"\s*[:\-–—]\s*"
_UNIT_RE = re.compile(
    r"(?im)\b(?:unidade\s+curricular|u\.\s?c\.|disciplina|cadeira)" + _SEP + r"([^\n|]{3,80})"
)
_COURSE_RE = re.compile(
    r"(?im)\b(licenciatura|mestrado(?:\s+integrado)?|doutoramento|ctesp|"
    r"curso\s+t[eé]cnico\s+superior\s+profissional)\s+em\s+([^\n,;|()]{3,80})"
)
_INSTITUTION_RE = re.compile(
    r"(?im)\b((?:universidade|instituto\s+(?:superior|polit[eé]cnico)|escola\s+superior|"
    r"faculdade)\b[^\n,;|()]{0,80})"
)
_TRAILING = re.compile(
    r"(\s+-\s+.*|\s{2,}.*|\s+(ano\s+le[c]?tivo|[ée]poca|data|exame|teste|frequ[êe]ncia)\b.*"
    r"|\s*\d{4}\s*[/-]\s*\d{2,4}.*)$",
    re.IGNORECASE,
)


_STOPWORDS = {"de", "da", "do", "das", "dos", "e", "a", "à", "o", "em", "para", "com", "na",
              "no", "of", "and", "the", "in", "for", "to", "y", "del", "la", "el", "et", "des",
              "du", "le", "les", "und", "der", "die"}
_INSTITUTION_WORDS = {"universidade", "instituto", "escola", "faculdade", "politecnico",
                      "university", "universidad", "college", "school"}
_ACRONYM_RE = re.compile(r"^[A-Za-z]*[A-Z][A-Za-z]*[A-Z][A-Za-z]*$")
_WORD_RE = re.compile(r"[^\W\d_][^\W_]*", re.UNICODE)
_BAD_NAME_RE = re.compile(r"[/\\`|<>=\[\]{}()]|\.\w{2,4}\b|\d{3,}")


@dataclass(frozen=True)
class ProposalCandidate:
    kind: ProposalKind
    name: str
    snippet: str
    page: int | None
    acronym: str | None = None


def _plausible_name(name: str) -> bool:
    """Um nome de cadeira/curso/instituição, não um caminho, listagem ou frase solta."""
    words = name.split()
    letters = sum(ch.isalpha() for ch in name)
    return (2 <= len(name) <= 90 and 1 <= len(words) <= 12 and name[0].isalpha()
            and not _BAD_NAME_RE.search(name) and letters >= 0.75 * len(name.replace(" ", "")))


def path_acronyms(paths: list[str]) -> list[str]:
    """Siglas candidatas: pastas e partes do nome dos ficheiros com 2–8 letras e pelo menos
    duas maiúsculas (UC, ED, IPRP, LEI…)."""
    found: list[str] = []
    for path in paths:
        parts = path.replace("!/", "/").split("/")
        tokens = [*parts[:-1], *re.split(r"[^A-Za-z]+", parts[-1].rsplit(".", 1)[0])]
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
    """"ESTRUTURAS DISCRETAS" → "Estruturas Discretas" (mantém o que já vem misturado)."""
    if name.upper() != name:
        return name
    return " ".join(w if w.lower() in _STOPWORDS else w.capitalize() for w in name.lower().split())


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
    for known in names:
        known_norm = normalize(known)
        if known_norm and (contains_phrase(norm, known_norm) or contains_phrase(known_norm, norm)):
            return True
    return False


def _known_acronym(catalog: Catalog, kind: ProposalKind, acronym: str) -> bool:
    if kind == "unit":
        values = [v for u in catalog.units.values() for v in (u.acronym, u.code, u.slug) if v]
    else:
        values = [v for i in catalog.institutions.values() for v in (i.acronym, i.slug) if v]
    return any(normalize(v) == normalize(acronym) for v in values)


def detect(pages: list[str], catalog: Catalog, max_pages: int = 2,
           paths: list[str] | None = None) -> list[ProposalCandidate]:
    found: dict[tuple[str, str], ProposalCandidate] = {}
    pages = [fix_spacing_accents(p) for p in pages[:max_pages]]
    header = pages[0][:1500] if pages else ""
    for acronym in path_acronyms(paths or []):
        for phrase, start, end in _phrases_with_initials(header, acronym):
            name = _title(phrase)
            first = normalize(name).split(" ", 1)[0]
            kind: ProposalKind = "institution" if first in _INSTITUTION_WORDS else "unit"
            if not _plausible_name(name) or _known(catalog, kind, name) \
                    or _known_acronym(catalog, kind, acronym):
                continue
            key = (kind, normalize(name))
            found.setdefault(key, ProposalCandidate(
                kind, name, _snippet(header, start, end), 1, acronym))
    for number, text in enumerate(pages[:max_pages], start=1):
        matches: list[tuple[ProposalKind, re.Match[str], int]] = []
        matches += [("unit", m, 1) for m in _UNIT_RE.finditer(text)]
        matches += [("course", m, 0) for m in _COURSE_RE.finditer(text)]
        matches += [("institution", m, 1) for m in _INSTITUTION_RE.finditer(text)]
        for kind, match, group in matches:
            if kind == "course":
                name = f"{match.group(1).strip().capitalize()} em {_clean(match.group(2))}"
            else:
                name = _clean(match.group(group))
            if len(normalize(name)) < 3 or not _plausible_name(name) \
                    or _known(catalog, kind, name):
                continue
            key = (kind, normalize(name))
            found.setdefault(key, ProposalCandidate(
                kind, name, _snippet(text, match.start(), match.end()), number))
    return list(found.values())
