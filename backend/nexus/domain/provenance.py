"""Proveniência: tudo o que é gerado (sobretudo por IA) liga à fonte (documento e página)."""

from __future__ import annotations

import datetime as dt

from pydantic import Field

from nexus.domain.common import Record


class SourceRef(Record):
    sha256: str
    page: int | None = None
    document: str | None = None


class Generated(Record):
    """Marca obrigatória em material gerado. `by` = "heuristic" ou "ai:<agente>"."""

    by: str
    at: dt.datetime
    model: str | None = None
    sources: list[SourceRef] = Field(default_factory=list)
