"""Correspondência com as unidades curriculares: inscrições primeiro, depois o catálogo."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from nexus.domain.catalog import CurricularUnit
from nexus.domain.documents import Reason
from nexus.domain.text import contains_phrase, contains_unit_phrase, normalize
from nexus.pipeline.classify.scoring import Candidate, rank
from nexus.pipeline.classify.signals import Signal

FEATURE_POINTS = {
    "code": 3.0,
    "acronym": 2.5,
    "name": 3.0,
    "alias": 2.5,
    "keyword": 0.4,
    "lecturer": 0.8,
}
# Identificam a cadeira pelo nome: "Análise Matemática" não é "Análise Matemática II".
IDENTITY = {"code", "acronym", "name", "alias"}
# Palavras-chave e docentes somam, mas com tecto por fonte (são sinais fracos).
CAPPED = {"keyword": 1.2, "lecturer": 1.2}


@dataclass(frozen=True)
class UnitFeatures:
    unit: CurricularUnit
    features: tuple[tuple[str, str, str], ...]  # (tipo, normalizado, original)


def compile_unit(unit: CurricularUnit) -> UnitFeatures:
    items: list[tuple[str, str, str]] = []

    def add(kind: str, text: str | None, min_len: int = 2) -> None:
        if not text:
            return
        norm = normalize(text)
        if len(norm.replace(" ", "")) >= min_len:
            items.append((kind, norm, text))

    add("code", unit.code)
    add("acronym", unit.acronym)
    add("name", unit.name, min_len=4)
    for alias in unit.aliases:
        add("alias", alias, min_len=3)
    for keyword in unit.keywords:
        add("keyword", keyword, min_len=3)
    for lecturer in unit.all_lecturers():
        add("lecturer", lecturer, min_len=5)
    return UnitFeatures(unit, tuple(items))


def score_unit(features: UnitFeatures, signals: list[Signal], boost: float) -> Candidate:
    candidate = Candidate(features.unit.key)
    for signal in signals:
        capped: dict[str, float] = {}
        for kind, norm, original in features.features:
            match = contains_unit_phrase if kind in IDENTITY else contains_phrase
            if not match(signal.norm, norm):
                continue
            points = FEATURE_POINTS[kind]
            if kind in CAPPED:
                room = CAPPED[kind] - capped.get(kind, 0.0)
                points = min(points, room)
                capped[kind] = capped.get(kind, 0.0) + points
            candidate.add(
                points * signal.weight,
                Reason(code=f"unit.{kind}", params={"value": original}, source=signal.source),
            )
    if boost != 1.0 and candidate.score > 0:
        bonus = candidate.score * (boost - 1.0)
        candidate.add(bonus, Reason(code="unit.enrolled", params={}))
    return candidate


def score_units(
    units: Iterable[UnitFeatures], signals: list[Signal], enrolled: set[str], boost: float
) -> list[Candidate]:
    return rank([
        score_unit(u, signals, boost if u.unit.key in enrolled else 1.0) for u in units
    ])
