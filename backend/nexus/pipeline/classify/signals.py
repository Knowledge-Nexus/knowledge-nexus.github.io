"""Sinais de classificação: pedaços de texto com a fonte de onde vieram."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import PurePosixPath

from nexus.config import ClassificationSettings
from nexus.domain.documents import Document
from nexus.domain.extraction import ExtractionMeta
from nexus.domain.text import normalize, strip_accents
from nexus.pipeline import layout

GENERATED_BATCH_RE = re.compile(r"^\d{8}T\d{6}Z-[a-z0-9]{3,}$")


@dataclass(frozen=True)
class Signal:
    source: str  # filename | path | layout | archive | header | body | metadata
    norm: str  # normalizado (correspondência de palavras)
    raw: str  # minúsculas sem acentos, com pontuação (datas, anos)
    weight: float
    page: int | None = None


def _raw(text: str) -> str:
    return strip_accents(text).lower()


def _signal(source: str, text: str, weight: float, page: int | None = None) -> Signal | None:
    norm = normalize(text)
    if not norm:
        return None
    return Signal(source, norm, _raw(text), weight, page)


def collect_signals(
    doc: Document,
    meta: ExtractionMeta | None,
    pages: list[str],
    settings: ClassificationSettings,
    archive_names: list[str],
) -> list[Signal]:
    weights = settings.source_weights
    signals: list[Signal | None] = []
    seen_paths: set[str] = set()
    for source in doc.sources:
        path = PurePosixPath(source.path.split("!/")[-1])
        if path.as_posix() in seen_paths:
            continue
        seen_paths.add(path.as_posix())
        stem = path.name.rsplit(".", 1)[0]
        signals.append(_signal("filename", stem, weights.filename))
        found = layout.parse(layout.full_path(source.batch, source.path))
        if found is not None:
            # Ano lectivo e cadeira vêm das pastas; as restantes (material, subpastas,
            # arquivos) contam como pastas normais.
            signals.append(_signal("layout", f"{found.academic_year} {found.unit}",
                                   weights.layout))
            if len(found.rest) > 1:
                signals.append(_signal("path", " / ".join(found.rest[:-1]), weights.path))
            continue
        folders = list(path.parts[:-1])
        if source.batch and not GENERATED_BATCH_RE.match(source.batch):
            folders.insert(0, source.batch)
        if folders:
            signals.append(_signal("path", " / ".join(folders), weights.path))
    for name in archive_names:
        signals.append(_signal("archive", name.rsplit(".", 1)[0], weights.archive))
    if meta is not None:
        meta_text = " ".join(meta.metadata.get(k, "") for k in ("title", "subject", "keywords"))
        signals.append(_signal("metadata", meta_text, weights.metadata))
    if pages:
        header = pages[0][: settings.header_chars]
        signals.append(_signal("header", header, weights.header, page=1))
        rest = pages[0][settings.header_chars :]
        for text in pages[1 : settings.body_pages]:
            rest += "\n" + text
        signals.append(_signal("body", rest, weights.body, page=None))
    return [s for s in signals if s is not None]
