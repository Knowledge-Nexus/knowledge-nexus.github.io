"""Pontuação de candidatos e cálculo de confiança (explicável: cada ponto tem uma razão)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from nexus.domain.documents import Alternative, FieldValue, Reason
from nexus.domain.text import contains_phrase, normalize
from nexus.domain.vocab import Term
from nexus.pipeline.classify.signals import Signal

MAX_PER_SOURCE = 2.0


@dataclass
class Candidate:
    value: Any
    score: float = 0.0
    reasons: list[Reason] = field(default_factory=list)

    def add(self, points: float, reason: Reason) -> None:
        if points <= 0:
            return
        self.score += points
        reason.weight = round(points, 3)
        self.reasons.append(reason)


def rank(candidates: list[Candidate]) -> list[Candidate]:
    positive = [c for c in candidates if c.score > 0]
    return sorted(positive, key=lambda c: (-c.score, str(c.value)))


def confidence(ranked: list[Candidate], prior: float) -> float:
    """melhor / (melhor + segundo + prior): um sinal forte e isolado dá confiança alta;
    dois candidatos equivalentes ou um sinal fraco dão confiança baixa."""
    if not ranked:
        return 0.0
    best = ranked[0].score
    second = ranked[1].score if len(ranked) > 1 else 0.0
    return round(best / (best + second + prior), 3)


def to_field(ranked: list[Candidate], prior: float, max_alternatives: int = 3) -> FieldValue | None:
    if not ranked:
        return None
    total = sum(c.score for c in ranked) + prior
    return FieldValue(
        value=ranked[0].value,
        confidence=confidence(ranked, prior),
        reasons=ranked[0].reasons,
        alternatives=[
            Alternative(value=c.value, confidence=round(c.score / total, 3))
            for c in ranked[1 : 1 + max_alternatives]
        ],
    )


@dataclass(frozen=True)
class CompiledTerm:
    term: Term
    keywords: tuple[str, ...]
    patterns: tuple[re.Pattern[str], ...]
    # forma normalizada → forma escrita no vocabulário (para as justificações)
    originals: dict[str, str] = field(default_factory=dict, compare=False, hash=False)
    # `excluded_by` normalizado
    excluded: tuple[str, ...] = field(default=(), compare=False, hash=False)

    @property
    def family_key(self) -> tuple[frozenset[str], frozenset[str]]:
        return frozenset(self.keywords), frozenset(p.pattern for p in self.patterns)


def compile_terms(terms: list[Term]) -> list[CompiledTerm]:
    out: list[CompiledTerm] = []
    for term in terms:
        originals: dict[str, str] = {}
        for keyword in term.keywords:
            norm = normalize(keyword)
            if norm:
                originals.setdefault(norm, keyword)
        patterns = tuple(re.compile(p) for p in term.patterns)
        excluded = tuple(n for n in (normalize(k) for k in term.excluded_by) if n)
        out.append(CompiledTerm(term, tuple(originals), patterns, originals, excluded))
    return out


def keyword_points(keyword: str) -> float:
    # Expressões mais longas são mais específicas ("mini teste" > "teste").
    return 1.0 + 0.5 * (len(keyword.split()) - 1)


def score_term(compiled: CompiledTerm, signals: list[Signal], value: Any = None) -> Candidate:
    candidate = Candidate(value if value is not None else compiled.term.slug)
    for signal in signals:
        matched = [kw for kw in compiled.keywords if contains_phrase(signal.norm, kw)]
        # Descarta palavras contidas numa expressão mais longa já encontrada.
        matched = [kw for kw in matched
                   if not any(kw != other and contains_phrase(other, kw) for other in matched)]
        points = sum(keyword_points(kw) for kw in matched)
        pattern_hits = [p.pattern for p in compiled.patterns if p.search(signal.norm)]
        points += len(pattern_hits)
        points = min(points, MAX_PER_SOURCE)
        if points > 0:
            candidate.add(
                points * signal.weight,
                Reason(
                    code="term.keyword",
                    params={"keywords": [compiled.originals.get(k, k) for k in matched]
                            + pattern_hits},
                    source=signal.source,
                ),
            )
    return candidate


def score_terms(terms: list[CompiledTerm], signals: list[Signal]) -> list[Candidate]:
    return rank([score_term(t, signals) for t in terms])
