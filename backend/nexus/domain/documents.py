"""Documentos: a cópia lógica que cada utilizador tem de um ficheiro (blob)."""

from __future__ import annotations

import datetime as dt
import re
from enum import StrEnum
from typing import Any, Literal

from pydantic import Field, field_validator

from nexus.domain.common import Record


class DocumentKind(StrEnum):
    FILE = "file"
    ARCHIVE = "archive"
    CODE_PROJECT = "code_project"


class Status(StrEnum):
    RECEIVED = "received"
    EXTRACTED = "extracted"
    CLASSIFIED = "classified"
    FILED = "filed"
    ENRICHED = "enriched"
    REVIEWED = "reviewed"


STATUS_ORDER: tuple[Status, ...] = tuple(Status)

METHOD_HEURISTIC = "heuristic"
METHOD_USER = "user"
_METHOD_RE = re.compile(r"^(heuristic|user|ai:[a-z0-9._-]+)$")
# Visibilidades de um documento (ver nexus.domain.visibility). Só `public` é publicada
# hoje; `link` e `user:<login>` ficam reservadas para quando houver contas (fase 5) e,
# até lá, contam como privadas.
VISIBILITY_RE = re.compile(
    r"^(private|public|link|unit_edition|group:[a-z0-9-]+|user:[A-Za-z0-9-]+)$")
_VISIBILITY_RE = VISIBILITY_RE

CLASSIFICATION_FIELDS: tuple[str, ...] = (
    "unit",
    "document_type",
    "academic_year",
    "assessment_type",
    "exam_season",
    "assessment_number",
    "role",
    "solution_origin",
    "topics",
    "date",
    "variant",
)


class Reason(Record):
    """Justificação estruturada: `code` é uma chave i18n (config/i18n/*/reasons.json)."""

    code: str
    params: dict[str, Any] = Field(default_factory=dict)
    source: str | None = None
    weight: float | None = None


class Alternative(Record):
    value: Any
    confidence: float


class FieldValue(Record):
    value: Any = None
    confidence: float = 0.0
    method: str = METHOD_HEURISTIC
    reasons: list[Reason] = Field(default_factory=list)
    alternatives: list[Alternative] = Field(default_factory=list)

    @field_validator("method")
    @classmethod
    def _check_method(cls, value: str) -> str:
        if not _METHOD_RE.match(value):
            raise ValueError(f"método inválido: {value}")
        return value

    @property
    def is_user(self) -> bool:
        return self.method == METHOD_USER


class Classification(Record):
    unit: FieldValue | None = None
    document_type: FieldValue | None = None
    academic_year: FieldValue | None = None
    assessment_type: FieldValue | None = None
    exam_season: FieldValue | None = None
    assessment_number: FieldValue | None = None
    role: FieldValue | None = None
    solution_origin: FieldValue | None = None
    topics: FieldValue | None = None
    # Avaliações: data da prova (AAAA-MM-DD) e versão/turno ("A", "B"…), para nomes únicos.
    date: FieldValue | None = None
    variant: FieldValue | None = None

    def value(self, name: str) -> Any:
        field: FieldValue | None = getattr(self, name)
        return field.value if field else None


class BlobRef(Record):
    sha256: str
    size: int
    ext: str
    mime: str


class Source(Record):
    via: Literal["upload", "git", "watch", "archive", "ref"]
    path: str
    batch: str | None = None
    received_at: dt.datetime | None = None


class HistoryEntry(Record):
    status: Status
    at: dt.datetime


class Review(Record):
    status: Literal["open", "resolved"] = "open"
    reasons: list[Reason] = Field(default_factory=list)
    opened_at: dt.datetime | None = None
    resolved_at: dt.datetime | None = None
    resolved_by: str | None = None


class ManifestFile(Record):
    path: str
    size: int
    sha256: str


class ManifestIgnored(Record):
    path: str
    files: int
    bytes: int


class Manifest(Record):
    """Conteúdo de um projecto de código guardado como unidade (zip determinístico)."""

    root: str
    files: list[ManifestFile] = Field(default_factory=list)
    ignored: list[ManifestIgnored] = Field(default_factory=list)


class BundleRef(Record):
    """Conjunto de ficheiros que só fazem sentido juntos (enunciado + código + imagens).

    `method`: `user` (juntados por ti) ou `heuristic` (pasta de projecto reconhecida pelo
    motor). `lead`: o documento principal, calculado pelo pipeline; os outros herdam dele a
    cadeira, o ano e o tipo (se não tiverem valores teus) e são arrumados com ele."""

    id: str
    name: str
    method: str = "user"
    lead: str | None = None
    # Principal escolhido por ti (manda sobre a escolha do motor, se ainda for do conjunto).
    lead_choice: str | None = None


class Document(Record):
    id: str
    owner: str
    kind: DocumentKind = DocumentKind.FILE
    blob: BlobRef
    parent: str | None = None
    sources: list[Source] = Field(default_factory=list)
    # None = segue a escolha do dono para a cadeira (ou privado, se não houver escolha).
    visibility: str | None = None
    status: Status = Status.RECEIVED
    history: list[HistoryEntry] = Field(default_factory=list)
    classification: Classification = Field(default_factory=Classification)
    classifier_version: int | None = None
    review: Review | None = None
    filed_name: str | None = None
    notes: str = ""
    near_duplicates_dismissed: list[str] = Field(default_factory=list)
    # Outro documento do mesmo dono com exactamente o mesmo texto (ficheiro diferente, ex.:
    # o mesmo PDF guardado de novo). Fica só esse na biblioteca; o original nunca se apaga.
    # "Não são iguais" (near_duplicates_dismissed) desfaz a ligação.
    duplicate_of: str | None = None
    bundle: BundleRef | None = None
    # "Separar": o motor deixa de propor conjuntos para este documento.
    bundle_dismissed: bool = False
    manifest: Manifest | None = None
    created_at: dt.datetime | None = None

    @field_validator("visibility")
    @classmethod
    def _check_visibility(cls, value: str | None) -> str | None:
        if value is not None and not _VISIBILITY_RE.match(value):
            raise ValueError(f"visibilidade inválida: {value}")
        return value

    def reached(self, status: Status) -> bool:
        return STATUS_ORDER.index(self.status) >= STATUS_ORDER.index(status)

    def advance(self, status: Status, at: dt.datetime) -> None:
        """Avança o estado (nunca recua) e regista a transição no histórico."""
        if self.reached(status):
            return
        self.status = status
        self.history = [*self.history, HistoryEntry(status=status, at=at)]

    def back_to(self, status: Status, at: dt.datetime) -> None:
        """Volta a um estado anterior (ex.: um documento arrumado cuja classificação voltou a
        ficar em dúvida) e regista a transição no histórico."""
        if self.status == status or not self.reached(status):
            return
        self.status = status
        self.history = [*self.history, HistoryEntry(status=status, at=at)]

    @property
    def needs_review(self) -> bool:
        return self.review is not None and self.review.status == "open"

    @property
    def display_name(self) -> str:
        if self.filed_name:
            return self.filed_name
        if self.sources:
            return self.sources[0].path.rsplit("/", 1)[-1]
        return self.blob.sha256[:12]
