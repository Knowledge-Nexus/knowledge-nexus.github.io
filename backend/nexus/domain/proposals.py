"""Propostas de catálogo (UC, curso ou instituição em falta) para a fila "A rever"."""

from __future__ import annotations

import datetime as dt
from typing import Any, Literal

from pydantic import Field

from nexus.domain.common import Record

ProposalKind = Literal["institution", "course", "unit"]


class Evidence(Record):
    document: str
    sha256: str
    page: int | None = None
    snippet: str


class CatalogProposal(Record):
    id: str
    kind: ProposalKind
    status: Literal["open", "accepted", "rejected"] = "open"
    data: dict[str, Any] = Field(default_factory=dict)
    evidence: list[Evidence] = Field(default_factory=list)
    created_at: dt.datetime | None = None
