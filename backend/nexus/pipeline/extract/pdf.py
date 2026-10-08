"""PDF: texto nativo por página (PyMuPDF); páginas sem texto passam por OCR."""

from __future__ import annotations

import logging
import os
from concurrent.futures import Future, ThreadPoolExecutor
from pathlib import Path

import pymupdf

from nexus.config import ExtractionSettings
from nexus.domain.text import fix_spacing_accents
from nexus.pipeline.extract.base import (
    ExtractionError,
    ExtractionResult,
    PageText,
    clean_text,
    looks_mathematical,
)
from nexus.pipeline.extract.ocr import OcrResult, ocr_image

# 2: acentos soltos dos PDFs em LaTeX juntos à letra (domain.text.fix_spacing_accents).
VERSION = 2
_META_KEYS = ("title", "author", "subject", "keywords", "creator", "producer", "creationDate")
log = logging.getLogger("nexus.extract.pdf")


def pdf_pages(
    path: Path, settings: ExtractionSettings, workdir: Path, allow_ocr: bool = True
) -> tuple[list[PageText], dict[str, str]]:
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # PyMuPDF lança vários tipos
        raise ExtractionError(f"PDF ilegível: {exc}") from exc
    if doc.needs_pass:
        raise ExtractionError("PDF protegido por palavra-passe")
    metadata = {k: str(v).strip() for k, v in (doc.metadata or {}).items()
                if k in _META_KEYS and v and str(v).strip()}
    # O Tesseract corre uma p?gina por processo (OMP_THREAD_LIMIT=1); v?rias p?ginas em paralelo.
    workers = max(1, min(os.cpu_count() or 1, settings.ocr_workers))
    pages: list[PageText | None] = []
    pending: dict[int, tuple[Future[OcrResult], Path]] = {}

    def collect(index: int) -> None:
        future, image = pending.pop(index)
        try:
            result = future.result()
        finally:
            image.unlink(missing_ok=True)
        text = clean_text(result.text)
        needs_ai = (
            result.confidence < settings.ai_transcription_confidence
            or result.words < 5
            or looks_mathematical(text)
        )
        pages[index] = PageText(text, "ocr", result.confidence, needs_ai)

    try:
        with doc, ThreadPoolExecutor(max_workers=workers) as pool:
            for index in range(doc.page_count):
                page = doc[index]
                native = clean_text(fix_spacing_accents(page.get_text("text", sort=True)))
                if len(native) >= settings.min_native_chars_per_page or not allow_ocr:
                    pages.append(PageText(native, "native" if native else "none"))
                    continue
                image = workdir / f"page-{index + 1:04d}.png"
                page.get_pixmap(dpi=settings.ocr_dpi).save(image)
                if index == 0 or (index + 1) % 10 == 0 or index + 1 == doc.page_count:
                    log.info("OCR de %s: p?gina %d/%d", path.name, index + 1, doc.page_count)
                pages.append(None)
                pending[index] = (
                    pool.submit(
                        ocr_image, image, settings.ocr_languages, settings.ocr_timeout_seconds
                    ),
                    image,
                )
                while len(pending) > workers * 2:
                    collect(min(pending))
            for index in sorted(pending):
                collect(index)
    except BaseException:
        for _future, image in pending.values():
            image.unlink(missing_ok=True)
        raise
    return [page for page in pages if page is not None], metadata


def extract_pdf(path: Path, settings: ExtractionSettings, workdir: Path) -> ExtractionResult:
    pages, metadata = pdf_pages(path, settings, workdir)
    return ExtractionResult("pdf", VERSION, pages, metadata)
