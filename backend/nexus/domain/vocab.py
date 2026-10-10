"""Vocabulários configuráveis: tipos de documento, avaliação, épocas, papéis e origens."""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from nexus.domain.common import Record

VocabKind = Literal[
    "document_types", "roles", "solution_origins", "assessment_types", "exam_seasons"
]
VOCAB_KINDS: tuple[VocabKind, ...] = (
    "document_types",
    "roles",
    "solution_origins",
    "assessment_types",
    "exam_seasons",
)

# Os únicos slugs que o código conhece: os papéis são um conceito do sistema.
ROLE_STATEMENT = "statement"
ROLE_SOLUTION = "solution"


class Term(Record):
    slug: str
    labels: dict[str, str] = Field(default_factory=dict)
    keywords: list[str] = Field(default_factory=list)
    patterns: list[str] = Field(default_factory=list)
    # Só para tipos de documento: papel exigido (statement/solution) ou indiferente.
    role: Literal["any", "statement", "solution"] = "any"
    is_assessment: bool = False
    is_submission: bool = False
    is_syllabus: bool = False
    is_fallback: bool = False
    # Só para tipos de documento: formatos que por si só são indício do tipo.
    extensions: list[str] = Field(default_factory=list)
    # Só para tipos de documento: programas que criaram o PDF (creator/producer) e que por
    # si só são indício do tipo (ex.: PowerPoint → slides).
    producers: list[str] = Field(default_factory=list)
    # Âmbito opcional: termo válido só numa instituição (slug).
    institution: str | None = None

    def label(self, locale: str = "pt-PT") -> str:
        return self.labels.get(locale) or next(iter(self.labels.values()), self.slug)


class Vocabularies(Record):
    version: int = 1
    document_types: list[Term] = Field(default_factory=list)
    roles: list[Term] = Field(default_factory=list)
    solution_origins: list[Term] = Field(default_factory=list)
    assessment_types: list[Term] = Field(default_factory=list)
    exam_seasons: list[Term] = Field(default_factory=list)
    # Termos genéricos do ensino ("unidade curricular", "ficha de trabalho"…): nunca são o
    # nome de uma cadeira, curso ou instituição, por isso não geram propostas.
    generic_terms: list[str] = Field(default_factory=list)

    def terms(self, kind: VocabKind, institution: str | None = None) -> list[Term]:
        return [
            t
            for t in getattr(self, kind)
            if t.institution is None or institution is None or t.institution == institution
        ]

    def get(self, kind: VocabKind, slug: str | None) -> Term | None:
        if slug is None:
            return None
        return next((t for t in getattr(self, kind) if t.slug == slug), None)

    def fallback(self, kind: VocabKind) -> Term | None:
        return next((t for t in getattr(self, kind) if t.is_fallback), None)
