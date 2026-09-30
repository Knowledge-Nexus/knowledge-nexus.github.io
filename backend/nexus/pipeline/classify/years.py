"""Ano lectivo a partir de padrões ("2023/24", "Ano Lectivo 2023-2024") ou de datas."""

from __future__ import annotations

import datetime as dt
import re

from nexus.domain.documents import FieldValue, Reason
from nexus.pipeline.classify.scoring import Candidate, rank
from nexus.pipeline.classify.signals import Signal

_ACADEMIC = re.compile(r"(?<!\d)((?:19|20)\d{2})\s*[/_\-.]\s*((?:19|20)?\d{2})(?!\d)")
_DATE = re.compile(r"(?<!\d)(\d{1,2})[/.\-](\d{1,2})[/.\-]((?:19|20)\d{2})(?!\d)")
_ISO_DATE = re.compile(r"(?<!\d)((?:19|20)\d{2})-(\d{2})-(\d{2})(?!\d)")
_MONTHS = {"janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
           "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11,
           "dezembro": 12}
_NAMED_DATE = re.compile(
    r"(?<!\d)(\d{1,2})\s+de\s+(" + "|".join(_MONTHS) + r")\s+(?:de\s+)?((?:19|20)\d{2})(?!\d)"
)
_LONE_YEAR = re.compile(r"(?<!\d)((?:19|20)\d{2})(?!\d)")

ACADEMIC_POINTS = 3.0
DATE_POINTS = 1.5
LONE_POINTS = 0.4


def academic_year_label(start: int) -> str:
    return f"{start}-{start + 1}"


def _from_date(year: int, month: int, start_month: int) -> str | None:
    if not 1 <= month <= 12:
        return None
    return academic_year_label(year if month >= start_month else year - 1)


def score_years(signals: list[Signal], start_month: int) -> list[Candidate]:
    candidates: dict[str, Candidate] = {}

    def add(label: str, points: float, code: str, text: str, source: str) -> None:
        candidate = candidates.setdefault(label, Candidate(label))
        candidate.add(points, Reason(code=code, params={"text": text}, source=source))

    for signal in signals:
        raw = signal.raw
        used: list[tuple[int, int]] = []
        for match in _ACADEMIC.finditer(raw):
            first = int(match.group(1))
            second_raw = match.group(2)
            second = int(second_raw) if len(second_raw) == 4 else (first // 100) * 100 + int(
                second_raw)
            if second == first + 1:
                add(academic_year_label(first), ACADEMIC_POINTS * signal.weight,
                    "year.academic", match.group(0), signal.source)
                used.append(match.span())
        for pattern, groups in ((_DATE, (3, 2)), (_ISO_DATE, (1, 2))):
            for match in pattern.finditer(raw):
                if any(a <= match.start() < b for a, b in used):
                    continue
                label = _from_date(int(match.group(groups[0])), int(match.group(groups[1])),
                                   start_month)
                if label:
                    add(label, DATE_POINTS * signal.weight, "year.date", match.group(0),
                        signal.source)
                    used.append(match.span())
        for match in _NAMED_DATE.finditer(raw):
            label = _from_date(int(match.group(3)), _MONTHS[match.group(2)], start_month)
            if label:
                add(label, DATE_POINTS * signal.weight, "year.date", match.group(0),
                    signal.source)
                used.append(match.span())
        for match in _LONE_YEAR.finditer(raw):
            if any(a <= match.start() < b for a, b in used):
                continue
            year = int(match.group(1))
            for label in (academic_year_label(year - 1), academic_year_label(year)):
                add(label, LONE_POINTS * signal.weight, "year.lone", match.group(0),
                    signal.source)
    return rank(list(candidates.values()))


def score_dates(signals: list[Signal]) -> FieldValue | None:
    """Data da prova (AAAA-MM-DD): a primeira data completa do nome do ficheiro ou do
    cabeçalho ("20-11-2024", "2024-11-20", "22 de novembro de 2023")."""
    for source in ("filename", "header"):
        for signal in (s for s in signals if s.source == source):
            raw = signal.raw[:600] if source == "header" else signal.raw
            found: list[tuple[int, str, str]] = []
            for match in _DATE.finditer(raw):
                found.append((match.start(), _iso(int(match.group(3)), int(match.group(2)),
                                                  int(match.group(1))), match.group(0)))
            for match in _ISO_DATE.finditer(raw):
                found.append((match.start(), _iso(int(match.group(1)), int(match.group(2)),
                                                  int(match.group(3))), match.group(0)))
            for match in _NAMED_DATE.finditer(raw):
                found.append((match.start(), _iso(int(match.group(3)),
                                                  _MONTHS[match.group(2)],
                                                  int(match.group(1))), match.group(0)))
            valid = sorted((pos, iso, text) for pos, iso, text in found if iso)
            if valid:
                _, iso, text = valid[0]
                return FieldValue(value=iso, confidence=0.9 if source == "header" else 0.8,
                                  reasons=[Reason(code="date.found", params={"text": text},
                                                  source=source)])
    return None


def _iso(year: int, month: int, day: int) -> str:
    try:
        return dt.date(year, month, day).isoformat()
    except ValueError:
        return ""
