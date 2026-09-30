"""Detecção de UCs, cursos e instituições que ainda não estão no catálogo.

Procura cabeçalhos típicos ("Unidade Curricular: …", "Licenciatura em …",
"Universidade de …") e devolve candidatos a proposta, com o excerto como evidência.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from nexus.domain.catalog import Catalog
from nexus.domain.proposals import ProposalKind
from nexus.domain.text import contains_phrase, normalize

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


@dataclass(frozen=True)
class ProposalCandidate:
    kind: ProposalKind
    name: str
    snippet: str
    page: int | None


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


def detect(pages: list[str], catalog: Catalog, max_pages: int = 2) -> list[ProposalCandidate]:
    found: dict[tuple[str, str], ProposalCandidate] = {}
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
            if len(normalize(name)) < 3 or _known(catalog, kind, name):
                continue
            key = (kind, normalize(name))
            found.setdefault(key, ProposalCandidate(
                kind, name, _snippet(text, match.start(), match.end()), number))
    return list(found.values())
