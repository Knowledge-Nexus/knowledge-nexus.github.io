"""Constrói os índices derivados (`meta.db`, `pesquisa.db`, `manifest.json`)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, insert

from nexus import FORMAT_VERSION, __version__, clock
from nexus.datarepo.store import DataRepo
from nexus.domain.catalog import Topic
from nexus.domain.documents import Document, DocumentKind
from nexus.domain.vocab import VOCAB_KINDS
from nexus.index import schema
from nexus.index.search import SEARCH_SCHEMA_VERSION, PageRow, create_search_db
from nexus.pipeline.hashing import hamming

META_DB = "meta.db"
SEARCH_DB = "pesquisa.db"
MANIFEST = "manifest.json"


@dataclass
class BuildResult:
    directory: Path
    documents: int
    pages: int
    near_duplicates: int


def _dump(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json", exclude_none=True)
    if isinstance(value, list):
        return [_dump(v) for v in value]
    return value


def _flatten_topics(unit_key: str, items: list[Topic], parent: str | None,
                    out: list[dict[str, Any]]) -> None:
    for topic in items:
        out.append({"unit_key": unit_key, "slug": topic.slug, "name": topic.name,
                    "parent_slug": parent, "sort": len(out)})
        _flatten_topics(unit_key, topic.children, topic.slug, out)


def _required_confidence(doc: Document, repo: DataRepo) -> float | None:
    settings = repo.settings.classification
    names = list(settings.required_fields)
    term = repo.vocabularies.get("document_types", doc.classification.value("document_type"))
    if term is not None and term.is_assessment:
        names += settings.required_for_assessments
    values = [getattr(doc.classification, n) for n in names]
    confidences = [1.0 if v.is_user else v.confidence for v in values if v is not None]
    if len(confidences) < len(names):
        return 0.0
    return min(confidences) if confidences else None


def near_duplicate_pairs(repo: DataRepo) -> list[tuple[str, str, int, float]]:
    settings = repo.settings.dedup
    hashes: list[tuple[str, str, str]] = []
    for doc in sorted(repo.documents.values(), key=lambda d: d.id):
        if doc.kind is DocumentKind.ARCHIVE:
            continue
        meta = repo.extraction_meta(doc.blob.sha256)
        if meta and meta.simhash and meta.words >= settings.min_words:
            hashes.append((doc.id, doc.blob.sha256, meta.simhash))
    dismissed = {(d.id, other) for d in repo.documents.values()
                 for other in d.near_duplicates_dismissed}
    pairs: list[tuple[str, str, int, float]] = []
    for i, (a_id, a_sha, a_hash) in enumerate(hashes):
        for b_id, b_sha, b_hash in hashes[i + 1 :]:
            if a_sha == b_sha or (a_id, b_id) in dismissed or (b_id, a_id) in dismissed:
                continue
            distance = hamming(a_hash, b_hash)
            if distance <= settings.near_duplicate_max_hamming:
                pairs.append((a_id, b_id, distance, round(1 - distance / 64, 3)))
    return pairs


def _file_info(path: Path) -> dict[str, Any]:
    return {"size": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def build_indices(repo: DataRepo, out: Path, built_from: str | None = None) -> BuildResult:
    out.mkdir(parents=True, exist_ok=True)
    catalog = repo.catalog
    vocab = repo.vocabularies
    built_at = clock.now().isoformat()
    meta_values = {
        "schema_version": str(schema.SCHEMA_VERSION),
        "search_schema_version": str(SEARCH_SCHEMA_VERSION),
        "format_version": str(FORMAT_VERSION),
        "app_version": __version__,
        "built_at": built_at,
        "built_from": built_from or "",
        "default_owner": str(repo.raw_settings.get("owner", "")),
        "auto_file_threshold": str(repo.settings.classification.auto_file_threshold),
    }

    meta_path = out / META_DB
    meta_path.unlink(missing_ok=True)
    engine = create_engine(f"sqlite:///{meta_path}")
    schema.metadata.create_all(engine)
    topic_rows: list[dict[str, Any]] = []
    for unit in catalog.units.values():
        _flatten_topics(unit.key, unit.topics, None, topic_rows)
    unit_course = {
        u.key: min((c.key for c in catalog.courses_of_unit(u.key)), default=None)
        for u in catalog.units.values()
    }
    doc_rows: list[dict[str, Any]] = []
    page_rows: list[PageRow] = []
    extraction_rows: list[dict[str, Any]] = []
    seen_sha: set[str] = set()
    for doc in sorted(repo.documents.values(), key=lambda d: d.id):
        c = doc.classification
        extraction = repo.extraction_meta(doc.blob.sha256)
        unit_key = c.value("unit")
        course_key = unit_course.get(unit_key) if unit_key else None
        first = doc.sources[0] if doc.sources else None
        doc_rows.append({
            "id": doc.id, "owner": doc.owner, "kind": doc.kind.value,
            "sha256": doc.blob.sha256, "size": doc.blob.size, "ext": doc.blob.ext,
            "mime": doc.blob.mime,
            "original_path": repo.layout.relative(
                repo.layout.original_path(doc.blob.sha256, doc.blob.ext)),
            "parent": doc.parent, "visibility": doc.visibility, "status": doc.status.value,
            "display_name": doc.display_name,
            "source_path": first.path if first else None,
            "batch": first.batch if first else None,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "unit": unit_key, "course": course_key,
            "document_type": c.value("document_type"),
            "academic_year": c.value("academic_year"),
            "assessment_type": c.value("assessment_type"),
            "exam_season": c.value("exam_season"),
            "assessment_number": c.value("assessment_number"),
            "role": c.value("role"), "solution_origin": c.value("solution_origin"),
            "confidence": _required_confidence(doc, repo),
            "needs_review": doc.needs_review,
            "review_reasons": _dump(doc.review.reasons) if doc.needs_review and doc.review
            else [],
            "classification": _dump(c),
            "sources": _dump(doc.sources),
            "history": _dump(doc.history),
            "manifest": _dump(doc.manifest) if doc.manifest else None,
            "notes": doc.notes,
            "pages": len(extraction.pages) if extraction else 0,
            "words": extraction.words if extraction else 0,
            "rendition": (repo.layout.relative(repo.layout.text_dir(doc.blob.sha256)
                                               / extraction.rendition)
                          if extraction and extraction.rendition else None),
            "pages_needing_transcription": sum(
                1 for p in extraction.pages if p.needs_ai_transcription) if extraction else 0,
        })
        if extraction is not None and doc.blob.sha256 not in seen_sha:
            seen_sha.add(doc.blob.sha256)
            extraction_rows.append({
                "sha256": doc.blob.sha256, "extractor": extraction.extractor,
                "extractor_version": extraction.extractor_version,
                "pages": [p.model_dump(mode="json", exclude_none=True) for p in extraction.pages],
                "metadata": extraction.metadata, "warnings": extraction.warnings,
            })
        if extraction is not None:
            for number, text in enumerate(repo.page_texts(doc.blob.sha256), start=1):
                if not text.strip():
                    continue
                page_rows.append(PageRow(
                    text=text, doc_id=doc.id, sha256=doc.blob.sha256, page=number,
                    owner=doc.owner, visibility=doc.visibility, unit=unit_key,
                    course=course_key, document_type=c.value("document_type"),
                    academic_year=c.value("academic_year"), title=doc.display_name))
    pairs = near_duplicate_pairs(repo)

    with engine.begin() as con:
        con.execute(insert(schema.meta), [{"key": k, "value": v}
                                          for k, v in sorted(meta_values.items())])
        if catalog.institutions:
            con.execute(insert(schema.institutions), [
                {"slug": i.slug, "name": i.name, "acronym": i.acronym}
                for i in catalog.institutions.values()])
        if catalog.courses:
            con.execute(insert(schema.courses), [
                {"key": c.key, "institution": c.institution, "slug": c.slug, "name": c.name,
                 "degree": c.degree} for c in catalog.courses.values()])
            links = [{"course_key": c.key, "unit_key": f"{c.institution}/{link.unit}",
                      "curricular_year": link.curricular_year, "semester": link.semester}
                     for c in catalog.courses.values() for link in c.units]
            if links:
                con.execute(insert(schema.course_units), links)
        if catalog.units:
            con.execute(insert(schema.units), [
                {"key": u.key, "institution": u.institution, "slug": u.slug, "code": u.code,
                 "name": u.name, "acronym": u.acronym, "ects": u.ects,
                 "lecturers": u.all_lecturers()} for u in catalog.units.values()])
            editions = [{"unit_key": u.key, "academic_year": e.academic_year,
                         "lecturers": e.lecturers, "assessment_method": e.assessment_method,
                         "assessments": _dump(e.assessments)}
                        for u in catalog.units.values() for e in u.editions]
            if editions:
                con.execute(insert(schema.unit_editions), editions)
        if topic_rows:
            con.execute(insert(schema.topics), topic_rows)
        terms = [{"kind": kind, "slug": t.slug, "label": t.label(), "labels": t.labels,
                  "role": t.role, "is_assessment": t.is_assessment,
                  "is_submission": t.is_submission, "is_syllabus": t.is_syllabus,
                  "is_fallback": t.is_fallback, "sort": index}
                 for kind in VOCAB_KINDS for index, t in enumerate(getattr(vocab, kind))]
        con.execute(insert(schema.vocab_terms), terms)
        if repo.users:
            con.execute(insert(schema.users), [
                {"login": u.login, "name": u.name, "preferences": _dump(u.preferences),
                 "enrollments": _dump(u.enrollments)} for u in repo.users.values()])
        if doc_rows:
            con.execute(insert(schema.documents), doc_rows)
        if extraction_rows:
            con.execute(insert(schema.extractions), extraction_rows)
        if pairs:
            con.execute(insert(schema.near_duplicates), [
                {"doc_a": a, "doc_b": b, "distance": d, "score": s} for a, b, d, s in pairs])
        if repo.proposals:
            con.execute(insert(schema.proposals), [
                {"id": p.id, "kind": p.kind, "status": p.status,
                 "name": str(p.data.get("name", p.id)), "data": p.data,
                 "evidence": _dump(p.evidence),
                 "created_at": p.created_at.isoformat() if p.created_at else None}
                for p in repo.proposals.values()])
    engine.dispose()

    search_path = out / SEARCH_DB
    create_search_db(search_path, page_rows, meta_values)
    manifest = {
        "schema_version": schema.SCHEMA_VERSION,
        "search_schema_version": SEARCH_SCHEMA_VERSION,
        "built_at": built_at,
        "built_from": built_from,
        "files": {META_DB: _file_info(meta_path), SEARCH_DB: _file_info(search_path)},
    }
    (out / MANIFEST).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return BuildResult(out, len(doc_rows), len(page_rows), len(pairs))
