"""Resultado da extracção de um blob (partilhado por todos os documentos com esse conteúdo)."""

from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import BaseModel, Field

PageMethod = Literal["native", "ocr", "ai", "none"]


class PageMeta(BaseModel):
    n: int
    method: PageMethod
    chars: int
    ocr_confidence: float | None = None
    # Manuscrito ou muita matemática: transcrever por IA (fase 2, /transcrever).
    needs_ai_transcription: bool = False
    # Rótulo opcional: título do slide, nome da folha, caminho do ficheiro de código.
    label: str | None = None


class ExtractionMeta(BaseModel):
    sha256: str
    extractor: str
    extractor_version: int
    pages: list[PageMeta] = Field(default_factory=list)
    metadata: dict[str, str] = Field(default_factory=dict)
    words: int = 0
    simhash: str | None = None
    # Caminho (relativo à pasta de texto) da versão PDF usada para abrir na página certa.
    rendition: str | None = None
    warnings: list[str] = Field(default_factory=list)
    extracted_at: dt.datetime | None = None
