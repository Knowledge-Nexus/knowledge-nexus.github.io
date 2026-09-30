"""Arrumação: nome normalizado `<ano-lectivo>_<descricao>.<ext>`."""

from __future__ import annotations

from pathlib import PurePosixPath

from nexus.domain.documents import Document
from nexus.domain.text import slugify
from nexus.domain.vocab import ROLE_SOLUTION, Vocabularies

NO_YEAR = "sem-ano"


def original_stem(doc: Document) -> str:
    if doc.sources:
        name = PurePosixPath(doc.sources[0].path.split("!/")[-1]).name
        return name.rsplit(".", 1)[0] if "." in name else name
    return doc.blob.sha256[:12]


def filed_name(doc: Document, vocab: Vocabularies) -> str:
    c = doc.classification
    year = c.value("academic_year") or NO_YEAR
    type_term = vocab.get("document_types", c.value("document_type"))
    parts: list[str] = []
    if type_term is not None and type_term.is_assessment:
        parts.append(c.value("assessment_type") or type_term.slug)
        if c.value("assessment_number") is not None:
            parts.append(str(c.value("assessment_number")))
        if c.value("exam_season"):
            parts.append(c.value("exam_season"))
        parts.append("resolucao" if c.value("role") == ROLE_SOLUTION else "enunciado")
    else:
        type_slug = type_term.slug if type_term else "documento"
        parts.append(type_slug)
        stem_parts = [p for p in slugify(original_stem(doc), 50).split("-")
                      if p not in type_slug.split("-")]
        parts.append("-".join(stem_parts) or doc.blob.sha256[:8])
    description = "-".join(slugify(str(p), 60) for p in parts if p)
    ext = "zip" if doc.kind == "code_project" else doc.blob.ext
    return f"{year}_{description}.{ext}" if ext else f"{year}_{description}"
