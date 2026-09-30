"""Operações sobre a fila "A rever": listar, propor (IA) e resolver (utilizador)."""

from __future__ import annotations

from typing import Any

from nexus import clock
from nexus.datarepo.catalog_io import write_unit
from nexus.datarepo.store import DataRepo
from nexus.domain.catalog import CurricularUnit
from nexus.domain.documents import (
    CLASSIFICATION_FIELDS,
    METHOD_USER,
    Document,
    FieldValue,
    Reason,
)
from nexus.domain.text import slugify

AI_METHOD = "ai:claude-code"


class ReviewError(ValueError):
    pass


def pending(repo: DataRepo) -> list[Document]:
    docs = [d for d in repo.documents.values() if d.needs_review]
    return sorted(docs, key=lambda d: d.id, reverse=True)


def describe(doc: Document) -> dict[str, Any]:
    return {
        "id": doc.id,
        "owner": doc.owner,
        "name": doc.display_name,
        "sources": [s.path for s in doc.sources],
        "status": doc.status.value,
        "sha256": doc.blob.sha256,
        "reasons": [r.model_dump(exclude_none=True) for r in (doc.review.reasons
                                                               if doc.review else [])],
        "classification": doc.classification.model_dump(mode="json", exclude_none=True),
    }


def _validate(repo: DataRepo, name: str, value: Any) -> None:
    if name not in CLASSIFICATION_FIELDS:
        raise ReviewError(f"campo desconhecido: {name}")
    if value is None:
        return
    vocab = repo.vocabularies
    kinds = {"document_type": "document_types", "assessment_type": "assessment_types",
             "exam_season": "exam_seasons", "solution_origin": "solution_origins",
             "role": "roles"}
    if name == "unit" and value not in repo.catalog.units:
        raise ReviewError(f"cadeira inexistente no catálogo: {value}")
    if name in kinds and vocab.get(kinds[name], str(value)) is None:  # type: ignore[arg-type]
        raise ReviewError(f"valor inexistente em {kinds[name]}: {value}")
    if name == "academic_year":
        text = str(value)
        if len(text) != 9 or text[4] != "-" or int(text[5:]) != int(text[:4]) + 1:
            raise ReviewError(f"ano lectivo inválido (usa 2023-2024): {value}")


def propose(repo: DataRepo, doc_id: str, fields: dict[str, dict[str, Any]],
            method: str = AI_METHOD) -> Document:
    """Grava propostas da IA. Nunca sobrepõe campos definidos pelo utilizador."""
    doc = _get(repo, doc_id).model_copy(deep=True)
    for name, spec in fields.items():
        value = spec.get("value")
        _validate(repo, name, value)
        current: FieldValue | None = getattr(doc.classification, name)
        if current is not None and current.is_user:
            continue
        confidence = float(spec.get("confidence", 0.0))
        if not 0.0 <= confidence <= 1.0:
            raise ReviewError(f"confiança fora de [0, 1] em {name}")
        justification = str(spec.get("justification", "")).strip()
        reasons = [Reason(code="ai.justification", params={"text": justification})] \
            if justification else []
        setattr(doc.classification, name, FieldValue(
            value=value, confidence=confidence, method=method, reasons=reasons,
            alternatives=current.alternatives if current else []))
    repo.save_document(doc)
    return doc


def resolve(repo: DataRepo, doc_id: str, values: dict[str, Any], login: str) -> Document:
    """Resolução pelo utilizador (equivalente à interface): campos ficam `user`."""
    doc = _get(repo, doc_id).model_copy(deep=True)
    for name, value in values.items():
        _validate(repo, name, value)
        setattr(doc.classification, name, FieldValue(
            value=value, confidence=1.0, method=METHOD_USER,
            reasons=[Reason(code="user.set", params={"login": login})]))
    if doc.review is not None and doc.review.status == "open":
        doc.review.status = "resolved"
        doc.review.resolved_at = clock.now()
        doc.review.resolved_by = login
    repo.save_document(doc)
    return doc


def accept_unit_proposal(repo: DataRepo, proposal_id: str, slug: str | None = None,
                         institution: str | None = None, code: str | None = None,
                         acronym: str | None = None) -> CurricularUnit:
    proposal = repo.proposals.get(proposal_id)
    if proposal is None or proposal.kind != "unit":
        raise ReviewError(f"proposta de cadeira inexistente: {proposal_id}")
    inst = institution or proposal.data.get("institution")
    if not inst or inst not in repo.catalog.institutions:
        raise ReviewError("indica a instituição (--instituicao) existente no catálogo")
    name = str(proposal.data.get("name"))
    unit = CurricularUnit(slug=slug or slugify(name, 40), name=name, code=code,
                          acronym=acronym or proposal.data.get("acronym"))
    unit.institution = inst
    if unit.key in repo.catalog.units:
        raise ReviewError(f"a cadeira {unit.key} já existe")
    write_unit(repo.layout, unit)
    updated = proposal.model_copy(update={"status": "accepted"})
    repo.save_proposal(updated)
    repo.reload_catalog()
    return unit


def set_proposal_status(repo: DataRepo, proposal_id: str, status: str) -> None:
    proposal = repo.proposals.get(proposal_id)
    if proposal is None:
        raise ReviewError(f"proposta inexistente: {proposal_id}")
    repo.save_proposal(proposal.model_copy(update={"status": status}))


def _get(repo: DataRepo, doc_id: str) -> Document:
    doc = repo.documents.get(doc_id)
    if doc is None:
        matches = [d for d in repo.documents.values() if d.id.startswith(doc_id)]
        if len(matches) != 1:
            raise ReviewError(f"documento inexistente ou ambíguo: {doc_id}")
        doc = matches[0]
    return doc
