"""Identificação do tipo de ficheiro (extensão + assinatura) e respectiva categoria."""

from __future__ import annotations

import mimetypes
import zipfile
from enum import StrEnum
from pathlib import Path


class Category(StrEnum):
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    XLSX = "xlsx"
    LEGACY_OFFICE = "legacy_office"
    IMAGE = "image"
    ARCHIVE = "archive"
    NOTEBOOK = "notebook"
    TEXT = "text"
    CODE = "code"
    OTHER = "other"


ARCHIVE_EXTS = {"zip", "rar", "7z", "tar", "tgz", "tar.gz", "tbz2", "tar.bz2", "txz", "tar.xz"}
LEGACY_OFFICE_TARGET = {
    "doc": "docx",
    "odt": "docx",
    "rtf": "docx",
    "wpd": "docx",
    "ppt": "pptx",
    "pps": "pptx",
    "odp": "pptx",
    "xls": "xlsx",
    "ods": "xlsx",
}
IMAGE_EXTS = {"png", "jpg", "jpeg", "tif", "tiff", "bmp", "gif", "webp", "heic", "heif"}
TEXT_EXTS = {"txt", "md", "markdown", "tex", "bib", "csv", "tsv", "json", "xml", "yaml", "yml",
             "log", "rst", "org", "srt"}
JUNK_NAMES = {".ds_store", "thumbs.db", "desktop.ini", ".gitkeep", ".keep"}

_EXTRA_MIME = {
    "md": "text/markdown",
    "heic": "image/heic",
    "heif": "image/heif",
    "ipynb": "application/x-ipynb+json",
    "7z": "application/x-7z-compressed",
    "rar": "application/vnd.rar",
    "tex": "application/x-tex",
    "yaml": "application/yaml",
    "yml": "application/yaml",
}

_SIGNATURES: list[tuple[bytes, str]] = [
    (b"%PDF", "pdf"),
    (b"Rar!\x1a\x07", "rar"),
    (b"7z\xbc\xaf\x27\x1c", "7z"),
    (b"\x89PNG", "png"),
    (b"\xff\xd8\xff", "jpg"),
    (b"\x1f\x8b", "tar.gz"),
    (b"\xd0\xcf\x11\xe0", "doc"),
]


def is_junk(name: str) -> bool:
    return name.lower() in JUNK_NAMES or name.startswith("._")


def extension_of(name: str) -> str:
    lower = name.lower()
    for double in ("tar.gz", "tar.bz2", "tar.xz"):
        if lower.endswith("." + double):
            return double
    suffix = Path(lower).suffix
    return suffix[1:] if suffix else ""


def _sniff(path: Path) -> str:
    with path.open("rb") as fh:
        head = fh.read(512)
    if head.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(path) as zf:
                names = set(zf.namelist())
        except zipfile.BadZipFile:
            return "zip"
        if "[Content_Types].xml" in names:
            if any(n.startswith("word/") for n in names):
                return "docx"
            if any(n.startswith("ppt/") for n in names):
                return "pptx"
            if any(n.startswith("xl/") for n in names):
                return "xlsx"
        return "zip"
    if head[4:12] in (b"ftypheic", b"ftypheix", b"ftypmif1"):
        return "heic"
    for signature, ext in _SIGNATURES:
        if head.startswith(signature):
            return ext
    return ""


def detect_extension(path: Path, name: str | None = None) -> str:
    """Extensão efectiva: a do nome, ou a detectada pela assinatura se não houver."""
    ext = extension_of(name or path.name)
    if ext:
        return "jpg" if ext == "jpeg" else ext
    return _sniff(path)


def mime_of(ext: str) -> str:
    if ext in _EXTRA_MIME:
        return _EXTRA_MIME[ext]
    guessed, _ = mimetypes.guess_type(f"x.{ext}")
    return guessed or "application/octet-stream"


def category_of(ext: str, code_extensions: set[str]) -> Category:
    if ext == "pdf":
        return Category.PDF
    if ext == "docx":
        return Category.DOCX
    if ext == "pptx":
        return Category.PPTX
    if ext in {"xlsx", "xlsm"}:
        return Category.XLSX
    if ext in LEGACY_OFFICE_TARGET:
        return Category.LEGACY_OFFICE
    if ext in IMAGE_EXTS:
        return Category.IMAGE
    if ext in ARCHIVE_EXTS:
        return Category.ARCHIVE
    if ext == "ipynb":
        return Category.NOTEBOOK
    if ext in TEXT_EXTS:
        return Category.TEXT
    if ext in code_extensions:
        return Category.CODE
    return Category.OTHER
