"""Registo de extractores e escrita do texto extraído em `texto/<sha256>/`.

A extracção é por conteúdo (blob): feita uma vez e partilhada por todos os documentos
com o mesmo SHA-256. Cada extractor tem uma versão; subir a versão provoca nova extracção.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from nexus import clock
from nexus.config import Settings
from nexus.datarepo.yamlio import write_json_if_changed, write_text_if_changed
from nexus.domain.documents import Manifest
from nexus.domain.extraction import ExtractionMeta, PageMeta
from nexus.pipeline.extract.base import (
    ExtractionError,
    ExtractionResult,
    MissingToolError,
    PageText,
)
from nexus.pipeline.extract.office import (
    DOCX_VERSION,
    LEGACY_VERSION,
    PPTX_VERSION,
    XLSX_VERSION,
    extract_docx,
    extract_legacy,
    extract_pptx,
    extract_xlsx,
)
from nexus.pipeline.extract.pdf import VERSION as PDF_VERSION
from nexus.pipeline.extract.pdf import extract_pdf
from nexus.pipeline.extract.simple import (
    IMAGE_VERSION,
    NOTEBOOK_VERSION,
    TEXT_VERSION,
    extract_image,
    extract_notebook,
    extract_text,
)
from nexus.pipeline.filetypes import LEGACY_OFFICE_TARGET, Category, category_of
from nexus.pipeline.hashing import simhash

__all__ = ["ExtractionError", "MissingToolError", "expected_extractor", "extract_file"]

ARCHIVE_VERSION = 1
CODE_PROJECT_VERSION = 1
OTHER_VERSION = 1
RENDITION_NAME = "render.pdf"


def expected_extractor(ext: str, settings: Settings, kind: str = "file") -> tuple[str, int]:
    """(nome, versão) do extractor que trataria este ficheiro."""
    if kind == "code_project":
        return "code_project", CODE_PROJECT_VERSION
    category = category_of(ext, set(settings.code_projects.code_extensions))
    match category:
        case Category.PDF:
            return "pdf", PDF_VERSION
        case Category.DOCX:
            return "docx", DOCX_VERSION
        case Category.PPTX:
            return "pptx", PPTX_VERSION
        case Category.XLSX:
            return "xlsx", XLSX_VERSION
        case Category.LEGACY_OFFICE:
            target = LEGACY_OFFICE_TARGET[ext]
            inner = {"docx": DOCX_VERSION, "pptx": PPTX_VERSION, "xlsx": XLSX_VERSION}[target]
            return f"legacy-{target}", LEGACY_VERSION * 100 + inner
        case Category.IMAGE:
            return "image", IMAGE_VERSION
        case Category.NOTEBOOK:
            return "notebook", NOTEBOOK_VERSION
        case Category.TEXT:
            return "text", TEXT_VERSION
        case Category.CODE:
            return "code", TEXT_VERSION
        case Category.ARCHIVE:
            return "archive", ARCHIVE_VERSION
        case _:
            return "other", OTHER_VERSION


def extract_file(path: Path, ext: str, settings: Settings, workdir: Path) -> ExtractionResult:
    workdir.mkdir(parents=True, exist_ok=True)
    extraction = settings.extraction
    category = category_of(ext, set(settings.code_projects.code_extensions))
    match category:
        case Category.PDF:
            return extract_pdf(path, extraction, workdir)
        case Category.DOCX:
            return extract_docx(path, extraction, workdir)
        case Category.PPTX:
            return extract_pptx(path, extraction, workdir)
        case Category.XLSX:
            return extract_xlsx(path, extraction, workdir)
        case Category.LEGACY_OFFICE:
            return extract_legacy(path, LEGACY_OFFICE_TARGET[ext], extraction, workdir)
        case Category.IMAGE:
            return extract_image(path, extraction, workdir)
        case Category.NOTEBOOK:
            return extract_notebook(path)
        case Category.TEXT | Category.CODE:
            return extract_text(path, ext, category is Category.CODE)
        case _:
            return ExtractionResult("other", OTHER_VERSION, [PageText("", "none")],
                                    warnings=[f"formato sem extractor de texto: .{ext}"])


def archive_listing(entries: list[str]) -> ExtractionResult:
    body = "\n".join(f"- `{e}`" for e in entries) or "(arquivo vazio)"
    return ExtractionResult("archive", ARCHIVE_VERSION, [PageText(body, label="conteúdo")])


def code_project_text(root: Path, manifest: Manifest, max_files: int = 300,
                      max_bytes: int = 100_000) -> ExtractionResult:
    """Uma "página" por ficheiro de código (limitado), precedida da árvore do projecto."""
    tree = "\n".join(f"- `{f.path}` ({f.size} B)" for f in manifest.files)
    ignored = "\n".join(f"- `{i.path}/` ignorado ({i.files} ficheiros)" for i in manifest.ignored)
    pages = [PageText(f"## Estrutura\n\n{tree}\n\n{ignored}".strip(), label="estrutura")]
    for file in manifest.files[:max_files]:
        source = root / file.path
        if not source.exists() or file.size > max_bytes:
            continue
        ext = file.path.rsplit(".", 1)[-1].lower() if "." in file.path else ""
        text = extract_text(source, ext, is_code=True).pages[0].text
        pages.append(PageText(f"### {file.path}\n\n{text}", label=file.path))
    return ExtractionResult("code_project", CODE_PROJECT_VERSION, pages)


def write_extraction(result: ExtractionResult, sha256: str, target: Path) -> ExtractionMeta:
    """Grava páginas, documento.md, meta.json e a versão PDF em `target` (texto/<sha>/)."""
    pages_dir = target / "paginas"
    if pages_dir.exists():
        shutil.rmtree(pages_dir)
    pages_dir.mkdir(parents=True, exist_ok=True)
    page_meta: list[PageMeta] = []
    for index, page in enumerate(result.pages, start=1):
        text = page.text.strip()
        write_text_if_changed(pages_dir / f"{index:04d}.md", text + "\n" if text else "")
        page_meta.append(PageMeta(
            n=index, method=page.method, chars=len(text), ocr_confidence=page.ocr_confidence,
            needs_ai_transcription=page.needs_ai, label=page.label,
        ))
    if result.document_md is not None:
        document = result.document_md.strip()
    else:
        document = "\n\n".join(
            f"<!-- página {i} -->\n\n{p.text.strip()}" for i, p in enumerate(result.pages, 1)
        )
    write_text_if_changed(target / "documento.md", document + "\n")
    rendition = None
    if result.rendition is not None and result.rendition.exists():
        shutil.copyfile(result.rendition, target / RENDITION_NAME)
        rendition = RENDITION_NAME
    digest, words = simhash(document)
    meta = ExtractionMeta(
        sha256=sha256, extractor=result.extractor, extractor_version=result.version,
        pages=page_meta, metadata=result.metadata, words=words,
        simhash=digest if words else None, rendition=rendition, warnings=result.warnings,
        extracted_at=clock.now(),
    )
    write_json_if_changed(target / "meta.json", meta.model_dump(mode="json", exclude_none=True))
    return meta
