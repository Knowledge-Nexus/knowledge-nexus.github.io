"""Tipos comuns aos extractores."""

from __future__ import annotations

import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from nexus.domain.extraction import PageMethod


class ExtractionError(RuntimeError):
    """O ficheiro não pôde ser lido (corrompido, protegido, formato inválido)."""


class MissingToolError(RuntimeError):
    """Falta uma ferramenta de sistema; o ficheiro fica no depósito para nova tentativa."""


@dataclass
class PageText:
    text: str
    method: PageMethod = "native"
    ocr_confidence: float | None = None
    needs_ai: bool = False
    label: str | None = None


@dataclass
class ExtractionResult:
    extractor: str
    version: int
    pages: list[PageText]
    metadata: dict[str, str] = field(default_factory=dict)
    # Versão Markdown integral (ex.: Pandoc com LaTeX); se None, junta-se as páginas.
    document_md: str | None = None
    # PDF equivalente (Office), para abrir na página citada.
    rendition: Path | None = None
    warnings: list[str] = field(default_factory=list)


def which(tool: str) -> str | None:
    return shutil.which(tool)


def require(tool: str, purpose: str) -> str:
    found = which(tool)
    if not found:
        raise MissingToolError(f"falta a ferramenta `{tool}` ({purpose}); corre `nexus verificar`")
    return found


_TRAILING_WS = re.compile(r"[ \t]+\n")
_MANY_BLANKS = re.compile(r"\n{3,}")


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    text = _TRAILING_WS.sub("\n", text)
    return _MANY_BLANKS.sub("\n\n", text).strip()


_MATH_CHARS = set("=+−-×÷*/^_{}()[]|<>≤≥≠≈∫∑∏√∞∂∇αβγδεθλμπσφωΔΣΩ0123456789")


def looks_mathematical(text: str) -> bool:
    """Heurística simples: muita densidade de símbolos matemáticos ou dígitos."""
    compact = [c for c in text if not c.isspace()]
    if len(compact) < 40:
        return False
    return sum(c in _MATH_CHARS for c in compact) / len(compact) > 0.35
