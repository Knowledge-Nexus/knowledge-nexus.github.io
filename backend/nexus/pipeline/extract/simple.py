"""Imagens (OCR), texto, código e notebooks."""

from __future__ import annotations

import json
from pathlib import Path

from charset_normalizer import from_bytes

from nexus.config import ExtractionSettings
from nexus.pipeline.extract.base import (
    ExtractionError,
    ExtractionResult,
    PageText,
    clean_text,
    looks_mathematical,
)
from nexus.pipeline.extract.ocr import ocr_image

IMAGE_VERSION = 1
TEXT_VERSION = 1
NOTEBOOK_VERSION = 1
MAX_TEXT_CHARS = 400_000

_LANG = {"py": "python", "js": "javascript", "ts": "typescript", "tsx": "tsx", "jsx": "jsx",
         "c": "c", "h": "c", "cpp": "cpp", "hpp": "cpp", "cc": "cpp", "cs": "csharp",
         "java": "java", "kt": "kotlin", "go": "go", "rs": "rust", "rb": "ruby", "php": "php",
         "sql": "sql", "sh": "bash", "r": "r", "m": "matlab", "jl": "julia", "hs": "haskell",
         "html": "html", "css": "css", "vhd": "vhdl", "vhdl": "vhdl", "v": "verilog",
         "asm": "asm", "s": "asm", "scala": "scala", "swift": "swift", "lua": "lua"}


def decode_bytes(data: bytes) -> str:
    if not data:
        return ""
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        best = from_bytes(data).best()
        return str(best) if best is not None else data.decode("latin-1", errors="replace")


def extract_image(path: Path, settings: ExtractionSettings, workdir: Path) -> ExtractionResult:
    from PIL import Image, ImageOps
    from pillow_heif import register_heif_opener

    register_heif_opener()
    try:
        with Image.open(path) as img:
            prepared = ImageOps.exif_transpose(img).convert("RGB")
    except Exception as exc:
        raise ExtractionError(f"imagem ilegível: {exc}") from exc
    png = workdir / "image.png"
    prepared.save(png)
    result = ocr_image(png, settings.ocr_languages, settings.ocr_timeout_seconds)
    text = clean_text(result.text)
    needs_ai = (result.confidence < settings.ai_transcription_confidence or result.words < 5
                or looks_mathematical(text))
    page = PageText(text, "ocr", result.confidence, needs_ai)
    return ExtractionResult("image", IMAGE_VERSION, [page],
                            {"width": str(prepared.width), "height": str(prepared.height)})


def extract_text(path: Path, ext: str, is_code: bool) -> ExtractionResult:
    text = decode_bytes(path.read_bytes()[: MAX_TEXT_CHARS * 4])[:MAX_TEXT_CHARS]
    body = f"```{_LANG.get(ext, ext)}\n{text.rstrip()}\n```" if is_code else clean_text(text)
    return ExtractionResult("code" if is_code else "text", TEXT_VERSION, [PageText(body)])


def extract_notebook(path: Path) -> ExtractionResult:
    try:
        notebook = json.loads(decode_bytes(path.read_bytes()))
    except json.JSONDecodeError as exc:
        raise ExtractionError(f"notebook inválido: {exc}") from exc
    language = (notebook.get("metadata", {}).get("kernelspec", {}) or {}).get("language", "python")
    blocks: list[str] = []
    for cell in notebook.get("cells", []):
        source = "".join(cell.get("source", []))
        if not source.strip():
            continue
        if cell.get("cell_type") == "markdown":
            blocks.append(source.strip())
        elif cell.get("cell_type") == "code":
            blocks.append(f"```{language}\n{source.rstrip()}\n```")
    return ExtractionResult("notebook", NOTEBOOK_VERSION, [PageText("\n\n".join(blocks))])
