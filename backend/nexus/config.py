"""Predefinições do motor e fusão com o `nexus.yaml` do repositório de dados."""

from __future__ import annotations

from functools import cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ConfigDict, Field


def config_dir() -> Path:
    """Pasta `config/` (empacotada como `nexus/_config` na wheel)."""
    packaged = Path(__file__).parent / "_config"
    if packaged.is_dir():
        return packaged
    return Path(__file__).resolve().parents[2] / "config"


def deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


class _Section(BaseModel):
    model_config = ConfigDict(extra="ignore")


class SourceWeights(_Section):
    filename: float = 1.0
    path: float = 0.8
    archive: float = 0.6
    header: float = 1.0
    body: float = 0.35
    metadata: float = 0.7
    # Pastas do ano lectivo e da cadeira na organização da origem (<ano>/<semestre>/<cadeira>).
    layout: float = 2.0


class ClassificationSettings(_Section):
    auto_file_threshold: float = 0.7
    prior: float = 1.0
    # Constante só para o tipo de documento (None: a mesma `prior`). O tipo pode ser menos
    # exigente do que a cadeira: um tipo trocado corrige-se arrastando na biblioteca.
    type_prior: float | None = None
    # Com a cadeira certa, arruma mesmo com o tipo em dúvida (no tipo mais provável, ou em
    # "Outros"), marcado "tipo por confirmar". Escolha do dono: por defeito, vai para "A rever".
    file_uncertain_type: bool = False
    source_weights: SourceWeights = Field(default_factory=SourceWeights)
    enrollment_boost: float = 1.25
    academic_year_start_month: int = 9
    header_chars: int = 1500
    body_pages: int = 3
    required_fields: list[str] = Field(default_factory=lambda: ["unit", "document_type"])
    required_for_assessments: list[str] = Field(
        default_factory=lambda: ["academic_year", "assessment_type"]
    )


class ExtractionSettings(_Section):
    ocr_languages: str = "por+eng"
    ocr_dpi: int = 300
    min_native_chars_per_page: int = 25
    ai_transcription_confidence: float = 60
    max_xlsx_rows: int = 200
    max_xlsx_cols: int = 30
    office_timeout_seconds: int = 180
    ocr_timeout_seconds: int = 120
    ocr_workers: int = 4


class ArchiveSettings(_Section):
    max_depth: int = 3
    max_entries: int = 5000
    max_total_bytes: int = 2 * 1024**3
    max_ratio: float = 200
    software_min_entries: int = 20
    software_other_ratio: float = 0.5


class CodeProjectSettings(_Section):
    markers: list[str] = Field(default_factory=list)
    min_code_files: int = 3
    code_ratio: float = 0.6
    ignored_dirs: list[str] = Field(default_factory=list)
    code_extensions: list[str] = Field(default_factory=list)


class DedupSettings(_Section):
    near_duplicate_max_hamming: int = 6
    min_words: int = 40


class LimitSettings(_Section):
    max_file_bytes: int = 99_614_720


class PublishingSettings(_Section):
    # "<dono>/<nome>" do repositório PÚBLICO onde vai o material marcado como público.
    public_repo: str | None = None
    public_branch: str = "main"


class StorageSettings(_Section):
    # "git" guarda os originais no repositório; "r2" envia-os para o Cloudflare R2.
    backend: str = "git"
    r2_bucket: str | None = None
    # Corte duro: com mais do que isto o R2 recusa gravações até o dono subir o valor.
    max_gb: float = 9.5


class Settings(_Section):
    classification: ClassificationSettings = Field(default_factory=ClassificationSettings)
    extraction: ExtractionSettings = Field(default_factory=ExtractionSettings)
    archives: ArchiveSettings = Field(default_factory=ArchiveSettings)
    code_projects: CodeProjectSettings = Field(default_factory=CodeProjectSettings)
    dedup: DedupSettings = Field(default_factory=DedupSettings)
    limits: LimitSettings = Field(default_factory=LimitSettings)
    publishing: PublishingSettings = Field(default_factory=PublishingSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)


@cache
def _defaults() -> dict[str, Any]:
    data = yaml.safe_load((config_dir() / "predefinicoes.yaml").read_text(encoding="utf-8"))
    return data or {}


def load_settings(overrides: dict[str, Any] | None = None) -> Settings:
    return Settings.model_validate(deep_merge(_defaults(), overrides or {}))
