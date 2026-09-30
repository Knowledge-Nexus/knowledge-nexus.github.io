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


class ClassificationSettings(_Section):
    auto_file_threshold: float = 0.7
    prior: float = 1.0
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


class ArchiveSettings(_Section):
    max_depth: int = 3
    max_entries: int = 5000
    max_total_bytes: int = 2 * 1024**3
    max_ratio: float = 200


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


class Settings(_Section):
    classification: ClassificationSettings = Field(default_factory=ClassificationSettings)
    extraction: ExtractionSettings = Field(default_factory=ExtractionSettings)
    archives: ArchiveSettings = Field(default_factory=ArchiveSettings)
    code_projects: CodeProjectSettings = Field(default_factory=CodeProjectSettings)
    dedup: DedupSettings = Field(default_factory=DedupSettings)
    limits: LimitSettings = Field(default_factory=LimitSettings)


@cache
def _defaults() -> dict[str, Any]:
    data = yaml.safe_load((config_dir() / "predefinicoes.yaml").read_text(encoding="utf-8"))
    return data or {}


def load_settings(overrides: dict[str, Any] | None = None) -> Settings:
    return Settings.model_validate(deep_merge(_defaults(), overrides or {}))
