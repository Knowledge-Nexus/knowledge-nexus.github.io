"""Orquestrador do pipeline: um ciclo de reconciliação idempotente (etapas 1 a 5).

1. Recepção: percorre o depósito, calcula SHA-256, deduplica.
2. Desempacotamento: arquivos → entradas; projectos de código ficam como unidade.
3. Extracção: por conteúdo, com cache; uma vez por blob e por versão do extractor.
4. Classificação: heurísticas; o que ficar ambíguo vai para "A rever".
5. Arrumação: nome normalizado; o original sai do depósito para `originais/`.

Cada item do depósito é transaccional: ou tudo corre bem e é aplicado, ou nada muda e
o ficheiro vai para `deposito/<login>/_erros/` com um `.log`. Correr duas vezes sobre o
mesmo estado não produz alterações.
"""

from __future__ import annotations

import contextlib
import functools
import logging
import os
import shutil
import tempfile
import traceback
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from nexus import clock
from nexus.datarepo.layout import ERRORS_DIR, LOG_SUFFIX
from nexus.datarepo.store import DataRepo
from nexus.datarepo.yamlio import read_yaml, write_text_if_changed
from nexus.domain.common import uuid7
from nexus.domain.documents import (
    CLASSIFICATION_FIELDS,
    METHOD_HEURISTIC,
    METHOD_USER,
    BlobRef,
    Document,
    DocumentKind,
    HistoryEntry,
    Manifest,
    Reason,
    Review,
    Source,
    Status,
)
from nexus.domain.proposals import CatalogProposal, Evidence
from nexus.domain.text import slugify
from nexus.pipeline import codeproject
from nexus.pipeline.classify.classifier import CLASSIFIER_VERSION, Classifier
from nexus.pipeline.classify.proposals import ProposalCandidate
from nexus.pipeline.classify.signals import GENERATED_BATCH_RE
from nexus.pipeline.extract import (
    ExtractionError,
    MissingToolError,
    archive_listing,
    code_project_text,
    expected_extractor,
    extract_file,
    write_extraction,
)
from nexus.pipeline.extract.base import ExtractionResult
from nexus.pipeline.filetypes import detect_extension, mime_of
from nexus.pipeline.filing import filed_name
from nexus.pipeline.hashing import sha256_file
from nexus.pipeline.intake import DepositItem, scan_deposit
from nexus.pipeline.unpack import ArchiveToolMissing, is_archive_name, unpack
from nexus.storage.blobstore import GitRepoBlobStore

log = logging.getLogger("nexus.pipeline")

EXTRACTION_FAILED = "review.extraction_failed"
MAX_EVIDENCE = 10


class ItemError(RuntimeError):
    pass


@dataclass
class RunReport:
    new_documents: list[str] = field(default_factory=list)
    new_sources: list[str] = field(default_factory=list)
    extracted: list[str] = field(default_factory=list)
    filed: list[str] = field(default_factory=list)
    review: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    proposals: list[str] = field(default_factory=list)
    errors: list[tuple[str, str]] = field(default_factory=list)
    skipped: list[tuple[str, str]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def summary(self) -> list[str]:
        lines = [
            f"documentos novos: {len(self.new_documents)}",
            f"reenvios do mesmo ficheiro (sem duplicar): {len(self.new_sources)}",
            f"conteúdos extraídos: {len(self.extracted)}",
            f"arrumados: {len(self.filed)}",
            f"a rever: {len(self.review)}",
            f"propostas de catálogo: {len(self.proposals)}",
        ]
        lines += [f"ERRO {label}: {message}" for label, message in self.errors]
        lines += [f"adiado {label}: {message}" for label, message in self.skipped]
        lines += [f"aviso: {w}" for w in self.warnings]
        return lines


@dataclass
class _Staging:
    docs: dict[str, Document] = field(default_factory=dict)
    blobs: list[tuple[Path, str, str, bool]] = field(default_factory=list)
    texts: dict[str, Path] = field(default_factory=dict)
    removals: list[Path] = field(default_factory=list)
    new_ids: list[str] = field(default_factory=list)
    resent_ids: list[str] = field(default_factory=list)
    extracted: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def default_cache_dir() -> Path:
    env = os.environ.get("NEXUS_CACHE_DIR")
    if env:
        return Path(env)
    return Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "nexus"


class Pipeline:
    def __init__(
        self, repo: DataRepo, cache_dir: Path | None = None, reclassify_all: bool = False
    ) -> None:
        self.repo = repo
        self.layout = repo.layout
        self.settings = repo.settings
        self.blobs = GitRepoBlobStore(repo.layout)
        self.cache_dir = cache_dir or default_cache_dir()
        self.reclassify_all = reclassify_all
        self.report = RunReport()
        self.now = clock.now()
        self.workdir = Path()
        self._extracted_now: set[str] = set()

    @property
    def default_owner(self) -> str:
        owner = self.repo.raw_settings.get("owner")
        if owner:
            return str(owner)
        if len(self.repo.users) == 1:
            return next(iter(self.repo.users))
        return "local"

    # --- ciclo principal ------------------------------------------------------------

    def run(self) -> RunReport:
        self.repo.check_format()
        with tempfile.TemporaryDirectory(prefix="nexus-") as tmp:
            self.workdir = Path(tmp)
            scan = scan_deposit(self.layout.deposit_root, set(self.repo.users),
                                self.default_owner, self.settings.code_projects)
            for junk in scan.junk:
                junk.unlink(missing_ok=True)
            for item in scan.items:
                self._intake(item)
            self._remove_empty_dirs()
            self._reconcile_all()
        return self.report

    # --- recepção -------------------------------------------------------------------

    def _intake(self, item: DepositItem) -> None:
        self.repo.ensure_user(item.login)
        staging = _Staging()
        try:
            if item.kind == "ref":
                self._intake_ref(item, staging)
            elif item.kind == "code_project":
                self._intake_code_project(item, staging)
            else:
                self._intake_file(item, staging)
            self._apply(staging)
        except (MissingToolError, ArchiveToolMissing) as exc:
            self.report.skipped.append((item.label, str(exc)))
            log.warning("adiado %s: %s", item.label, exc)
        except Exception as exc:
            log.exception("falhou %s", item.label)
            self._fail(item, exc)

    def _via(self, item: DepositItem) -> str:
        return "upload" if item.batch and GENERATED_BATCH_RE.match(item.batch) else "git"

    def _intake_file(self, item: DepositItem, staging: _Staging) -> None:
        path = item.path
        size = path.stat().st_size
        if size > self.settings.limits.max_file_bytes:
            raise ItemError(f"ficheiro com {size} bytes excede o limite de "
                            f"{self.settings.limits.max_file_bytes}")
        sha = sha256_file(path)
        ext = detect_extension(path)
        source = Source(via=self._via(item), path=item.rel, batch=item.batch,
                        received_at=self.now)
        archive = is_archive_name(f"x.{ext}")
        doc = self._register(staging, item.login, sha, ext, size, source,
                             DocumentKind.ARCHIVE if archive else DocumentKind.FILE,
                             None, path, move=True)
        if archive:
            self._expand_archive(staging, doc, path, ext, 1, item.rel, item.batch)
        else:
            self._ensure_text(staging, sha, ext, "file", lambda: extract_file(
                path, ext, self.settings, self.workdir / f"x-{sha[:16]}"))

    def _intake_ref(self, item: DepositItem, staging: _Staging) -> None:
        data = read_yaml(item.path) or {}
        sha = str(data.get("sha256", ""))
        if len(sha) != 64 or not self.blobs.exists(sha):
            raise ItemError("referência a conteúdo inexistente (envia o ficheiro completo)")
        known = next((d.blob for d in self.repo.documents.values() if d.blob.sha256 == sha), None)
        original = self.layout.find_original(sha)
        if known is not None:
            blob = known
        elif original is not None:
            ext = detect_extension(original)
            blob = BlobRef(sha256=sha, size=original.stat().st_size, ext=ext, mime=mime_of(ext))
        else:
            raise ItemError("não foi possível determinar o tipo do conteúdo referido")
        rel = str(data.get("path") or data.get("name") or item.rel.removesuffix(".ref.yaml"))
        source = Source(via="ref", path=rel, batch=item.batch, received_at=self.now)
        existing = self._find(staging, item.login, sha)
        if existing is None:
            doc = self._new_document(item.login, blob, DocumentKind.FILE, None, source)
            staging.docs[doc.id] = doc
            staging.new_ids.append(doc.id)
        else:
            self._add_source(staging, existing, source)
        staging.removals.append(item.path)

    def _intake_code_project(self, item: DepositItem, staging: _Staging) -> None:
        bundle = self.workdir / f"project-{uuid7()}.zip"
        manifest = codeproject.build_bundle(item.base, item.rel, item.files, bundle,
                                            self.settings.code_projects)
        source = Source(via=self._via(item), path=item.rel or ".", batch=item.batch,
                        received_at=self.now)
        project_root = item.base / item.rel if item.rel else item.base
        self._register_project(staging, item.login, bundle, manifest, source, None,
                               project_root)
        staging.removals.extend(item.deposit_paths())

    # --- registo e desempacotamento -------------------------------------------------

    def _find(self, staging: _Staging, owner: str, sha: str) -> Document | None:
        for doc in staging.docs.values():
            if doc.owner == owner and doc.blob.sha256 == sha:
                return doc
        found = self.repo.find_document(owner, sha)
        return found.model_copy(deep=True) if found else None

    def _new_document(self, owner: str, blob: BlobRef, kind: DocumentKind, parent: str | None,
                      source: Source) -> Document:
        return Document(
            id=uuid7(), owner=owner, kind=kind, blob=blob, parent=parent, sources=[source],
            status=Status.RECEIVED, history=[HistoryEntry(status=Status.RECEIVED, at=self.now)],
            created_at=self.now,
        )

    def _add_source(self, staging: _Staging, doc: Document, source: Source) -> None:
        key = (source.via, source.path, source.batch)
        if all((s.via, s.path, s.batch) != key for s in doc.sources):
            doc.sources = [*doc.sources, source]
            staging.resent_ids.append(doc.id)
        staging.docs[doc.id] = doc

    def _register(self, staging: _Staging, owner: str, sha: str, ext: str, size: int,
                  source: Source, kind: DocumentKind, parent: str | None, file: Path,
                  move: bool) -> Document:
        staging.blobs.append((file, sha, ext, move))
        existing = self._find(staging, owner, sha)
        if existing is not None:
            self._add_source(staging, existing, source)
            return existing
        blob = BlobRef(sha256=sha, size=size, ext=ext, mime=mime_of(ext))
        doc = self._new_document(owner, blob, kind, parent, source)
        staging.docs[doc.id] = doc
        staging.new_ids.append(doc.id)
        return doc

    def _register_project(self, staging: _Staging, owner: str, bundle: Path,
                          manifest: Manifest, source: Source, parent: str | None,
                          project_root: Path) -> Document:
        sha = sha256_file(bundle)
        doc = self._register(staging, owner, sha, "zip", bundle.stat().st_size, source,
                             DocumentKind.CODE_PROJECT, parent, bundle, move=False)
        doc.manifest = manifest
        self._ensure_text(staging, sha, "zip", "code_project",
                          lambda: code_project_text(project_root, manifest))
        return doc

    def _expand_archive(self, staging: _Staging, archive_doc: Document, path: Path, ext: str,
                        depth: int, label: str, batch: str | None) -> None:
        sha = archive_doc.blob.sha256
        if depth > self.settings.archives.max_depth:
            self.report.warnings.append(f"{label}: arquivo demasiado aninhado, não aberto")
            self._ensure_text(staging, sha, ext, "file", lambda: archive_listing([]))
            return
        dest = self.workdir / f"unpack-{sha[:16]}-{depth}"
        entries = unpack(path, ext, dest, self.settings.archives)
        files = [e.path for e in entries]
        self._ensure_text(staging, sha, ext, "file", lambda: archive_listing(files))
        projects = codeproject.find_projects(files, self.settings.code_projects)
        in_project: set[str] = set()
        for project in projects:
            members = codeproject.files_in(project, files)
            in_project.update(members)
            bundle = self.workdir / f"project-{uuid7()}.zip"
            manifest = codeproject.build_bundle(dest, project, members, bundle,
                                                self.settings.code_projects)
            source = Source(via="archive", path=f"{label}!/{project or '.'}", batch=batch,
                            received_at=self.now)
            self._register_project(staging, archive_doc.owner, bundle, manifest, source,
                                   archive_doc.id, dest / project if project else dest)
        for entry in entries:
            if entry.path in in_project:
                continue
            child_sha = sha256_file(entry.local)
            child_ext = detect_extension(entry.local)
            nested = is_archive_name(f"x.{child_ext}")
            source = Source(via="archive", path=f"{label}!/{entry.path}", batch=batch,
                            received_at=self.now)
            child = self._register(
                staging, archive_doc.owner, child_sha, child_ext, entry.local.stat().st_size,
                source, DocumentKind.ARCHIVE if nested else DocumentKind.FILE, archive_doc.id,
                entry.local, move=False)
            if nested:
                self._expand_archive(staging, child, entry.local, child_ext, depth + 1,
                                     f"{label}!/{entry.path}", batch)
                continue
            try:
                self._ensure_text(staging, child_sha, child_ext, "file", functools.partial(
                    extract_file, entry.local, child_ext, self.settings,
                    self.workdir / f"x-{child_sha[:16]}"))
            except ExtractionError as exc:
                # O arquivo continua guardado; a entrada ilegível fica para revisão.
                child.review = Review(status="open", opened_at=self.now, reasons=[
                    Reason(code=EXTRACTION_FAILED, params={"error": str(exc)})])

    # --- extracção ------------------------------------------------------------------

    def _cache_path(self, sha: str, name: str, version: int) -> Path:
        return self.cache_dir / "extract" / f"{sha}-{name}-v{version}"

    def _ensure_text(self, staging: _Staging, sha: str, ext: str, kind: str,
                     produce: Callable[[], ExtractionResult]) -> None:
        if sha in self._extracted_now or sha in staging.texts:
            return
        name, version = expected_extractor(ext, self.settings, kind)
        meta = self.repo.extraction_meta(sha)
        if meta is not None and (meta.extractor, meta.extractor_version) == (name, version):
            return
        cached = self._cache_path(sha, name, version)
        if (cached / "meta.json").exists():
            out = self.workdir / f"text-{sha}"
            shutil.copytree(cached, out)
            staging.texts[sha] = out
            return
        result = produce()
        out = self.workdir / f"text-{sha}"
        write_extraction(result, sha, out)
        try:
            if cached.exists():
                shutil.rmtree(cached)
            shutil.copytree(out, cached)
        except OSError as exc:  # a cache é só uma optimização
            log.debug("cache indisponível: %s", exc)
        staging.texts[sha] = out
        staging.extracted.append(sha)
        staging.warnings.extend(f"{sha[:12]}: {w}" for w in result.warnings)

    def _apply(self, staging: _Staging) -> None:
        for sha, tmp in staging.texts.items():
            target = self.layout.text_dir(sha)
            if target.exists():
                shutil.rmtree(target)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(tmp, target)
            self._extracted_now.add(sha)
        for file, sha, ext, move in staging.blobs:
            if file.exists():
                self.blobs.put(file, sha, ext, move)
        for doc in staging.docs.values():
            self.repo.save_document(doc)
        for path in staging.removals:
            path.unlink(missing_ok=True)
        self.report.new_documents += staging.new_ids
        self.report.new_sources += [i for i in staging.resent_ids if i not in staging.new_ids]
        self.report.extracted += staging.extracted
        self.report.warnings += staging.warnings

    def _fail(self, item: DepositItem, exc: BaseException) -> None:
        errors = self.layout.errors_dir(item.login) / (item.batch or "")
        for path in item.deposit_paths():
            if not path.exists():
                continue
            target = errors / path.relative_to(item.base)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(path, target)
        log_name = (item.rel or "projecto").replace("/", "__") + LOG_SUFFIX
        text = "\n".join([
            f"data: {self.now.isoformat()}",
            f"item: {item.label}",
            f"tipo: {item.kind}",
            f"erro: {type(exc).__name__}: {exc}",
            "",
            "".join(traceback.format_exception(exc)),
        ])
        write_text_if_changed(errors / log_name, text)
        self.report.errors.append((item.label, str(exc)))

    def _remove_empty_dirs(self) -> None:
        root = self.layout.deposit_root
        if not root.is_dir():
            return
        for folder in sorted((p for p in root.rglob("*") if p.is_dir()), reverse=True):
            if folder.name == ERRORS_DIR:
                continue
            with contextlib.suppress(OSError):
                folder.rmdir()

    # --- classificação e arrumação --------------------------------------------------

    def _reconcile_all(self) -> None:
        classifier = Classifier(self.repo.vocabularies, self.repo.catalog,
                                self.settings.classification)
        for doc_id in sorted(self.repo.documents):
            try:
                self._reconcile(self.repo.documents[doc_id].model_copy(deep=True), classifier)
            except (MissingToolError, ArchiveToolMissing) as exc:
                self.report.skipped.append((doc_id, str(exc)))
            except Exception as exc:
                log.exception("falhou a reconciliação de %s", doc_id)
                self.report.errors.append((doc_id, f"{type(exc).__name__}: {exc}"))

    def _archive_names(self, doc: Document) -> list[str]:
        names: list[str] = []
        parent_id = doc.parent
        while parent_id and parent_id in self.repo.documents and len(names) < 5:
            parent = self.repo.documents[parent_id]
            if parent.sources:
                names.append(parent.sources[0].path.split("!/")[-1])
            parent_id = parent.parent
        return names

    def _reextract(self, doc: Document) -> None:
        name, version = expected_extractor(doc.blob.ext, self.settings, doc.kind)
        meta = self.repo.extraction_meta(doc.blob.sha256)
        if meta is not None and (meta.extractor, meta.extractor_version) == (name, version):
            return
        if doc.kind is not DocumentKind.FILE:
            return  # arquivos e projectos são extraídos na recepção
        sha, ext = doc.blob.sha256, doc.blob.ext
        staging = _Staging()
        source = self.blobs.materialize(sha, ext, self.workdir / "blobs")
        try:
            self._ensure_text(staging, sha, ext, "file", lambda: extract_file(
                source, ext, self.settings, self.workdir / f"x-{sha[:16]}"))
        except ExtractionError as exc:
            doc.review = Review(status="open", opened_at=self.now, reasons=[
                Reason(code=EXTRACTION_FAILED, params={"error": str(exc)})])
            return
        self._apply(staging)

    def _needs_classification(self, doc: Document) -> bool:
        return (
            self.reclassify_all
            or doc.classifier_version != CLASSIFIER_VERSION
            or not doc.reached(Status.CLASSIFIED)
            or doc.needs_review
        )

    def _reconcile(self, doc: Document, classifier: Classifier) -> None:
        self._reextract(doc)
        sha = doc.blob.sha256
        meta = self.repo.extraction_meta(sha)
        if meta is not None:
            doc.advance(Status.EXTRACTED, self.now)
        proposal_ids: list[str] = []
        if meta is not None and self._needs_classification(doc):
            pages = self.repo.page_texts(sha)
            outcome = classifier.classify(doc, meta, pages, self.repo.users.get(doc.owner),
                                          self._archive_names(doc), fixed=doc.classification)
            for name in CLASSIFICATION_FIELDS:
                current = getattr(doc.classification, name)
                if current is not None and current.method != METHOD_HEURISTIC:
                    continue  # campos do utilizador ou da IA nunca são sobrepostos
                setattr(doc.classification, name, getattr(outcome.classification, name))
            doc.classifier_version = CLASSIFIER_VERSION
            doc.advance(Status.CLASSIFIED, self.now)
            weak = self._weak(doc, classifier)
            proposal_ids = self._record_proposals(doc, outcome.proposals, weak)
        self._review_and_file(doc, classifier, meta is not None, proposal_ids)

    def _weak(self, doc: Document, classifier: Classifier) -> list[str]:
        type_term = self.repo.vocabularies.get("document_types",
                                               doc.classification.value("document_type"))
        return classifier.weak_fields(doc.classification, type_term)

    def _record_proposals(self, doc: Document, candidates: list[ProposalCandidate],
                          weak: list[str]) -> list[str]:
        catalog = self.repo.catalog
        ids: list[str] = []
        for candidate in candidates:
            if candidate.kind == "unit" and "unit" not in weak:
                continue
            if candidate.kind == "institution" and catalog.institutions:
                continue
            if candidate.kind == "course" and catalog.courses:
                continue
            pid = f"{candidate.kind}-{slugify(candidate.name, 50)}"
            existing = self.repo.proposals.get(pid)
            if existing is not None and existing.status != "open":
                continue
            proposal = (existing.model_copy(deep=True) if existing else CatalogProposal(
                id=pid, kind=candidate.kind, data={"name": candidate.name},
                created_at=self.now))
            if candidate.kind == "unit" and len(catalog.institutions) == 1:
                proposal.data = {**proposal.data, "institution": next(iter(catalog.institutions))}
            if all(e.document != doc.id for e in proposal.evidence) and \
                    len(proposal.evidence) < MAX_EVIDENCE:
                proposal.evidence = [*proposal.evidence, Evidence(
                    document=doc.id, sha256=doc.blob.sha256, page=candidate.page,
                    snippet=candidate.snippet)]
            if self.repo.save_proposal(proposal):
                self.report.proposals.append(pid)
            if candidate.kind == "unit":
                ids.append(pid)
        return ids

    def _review_and_file(self, doc: Document, classifier: Classifier, extracted: bool,
                         proposal_ids: list[str]) -> None:
        original = self.repo.documents.get(doc.id)
        reasons: list[Reason] = []
        if not extracted and doc.review is not None and doc.review.status == "open":
            reasons += [r for r in doc.review.reasons if r.code == EXTRACTION_FAILED]
        if doc.reached(Status.CLASSIFIED) and doc.kind is not DocumentKind.ARCHIVE:
            for name in self._weak(doc, classifier):
                current = getattr(doc.classification, name)
                if current is None or current.value is None:
                    reasons.append(Reason(code="review.missing", params={"field": name}))
                else:
                    reasons.append(Reason(code="review.low_confidence", params={
                        "field": name, "confidence": current.confidence}))
            for pid in proposal_ids or self._open_unit_proposals(doc):
                reasons.append(Reason(code="review.unit_proposed", params={"proposal": pid}))
        elif not doc.reached(Status.CLASSIFIED) and not reasons:
            return self._save(doc, original)

        if reasons:
            if doc.review is None or doc.review.status != "open":
                doc.review = Review(status="open", reasons=reasons, opened_at=self.now)
            elif doc.review.reasons != reasons:
                doc.review.reasons = reasons
            self.report.review.append(doc.id)
        else:
            if doc.review is not None and doc.review.status == "open":
                doc.review.status = "resolved"
                doc.review.resolved_at = self.now
                doc.review.resolved_by = "pipeline"
            doc.filed_name = filed_name(doc, self.repo.vocabularies)
            if not doc.reached(Status.FILED):
                self.report.filed.append(doc.id)
            doc.advance(Status.FILED, self.now)
            required = [f for f in self.settings.classification.required_fields
                        if getattr(doc.classification, f) is not None]
            if required and all(getattr(doc.classification, f).method == METHOD_USER
                                for f in required):
                doc.advance(Status.REVIEWED, self.now)
        return self._save(doc, original)

    def _open_unit_proposals(self, doc: Document) -> list[str]:
        return sorted(
            p.id for p in self.repo.proposals.values()
            if p.kind == "unit" and p.status == "open"
            and any(e.document == doc.id for e in p.evidence)
        )

    def _save(self, doc: Document, original: Document | None) -> None:
        if self.repo.save_document(doc) and original is not None:
            self.report.updated.append(doc.id)
