"""Versões do formato dos ficheiros do repositório de dados e respectivas migrações.

Na arquitectura "só GitHub" a base de dados é derivada: as *migrações* reais são as do
formato dos ficheiros YAML. Cada migração recebe a raiz do repositório e passa-o da
versão N para N+1. `nexus migrar` aplica-as por ordem e actualiza `format_version`.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from pathlib import Path

from nexus import FORMAT_VERSION
from nexus.datarepo.layout import Layout
from nexus.datarepo.yamlio import read_yaml, write_yaml_if_changed

Migration = Callable[[Path], None]



def _v1_visibility_inherits(root: Path) -> None:
    """1 → 2: `visibility: private` era só a predefinição; passa a "seguir a cadeira"."""
    for path in sorted(Layout(root).documents_dir.glob("*.yaml")):
        data = read_yaml(path)
        if isinstance(data, dict) and data.get("visibility") == "private":
            del data["visibility"]
            write_yaml_if_changed(path, data)


def _v2_duplicate_of(root: Path) -> None:
    """2 → 3: novo campo opcional `duplicate_of` nos documentos (calculado pelo pipeline)."""


def _v3_bundles(root: Path) -> None:
    """3 → 4: novos campos opcionais `bundle` e `bundle_dismissed` nos documentos."""


# {versão de origem: função que migra para a versão seguinte}
MIGRATIONS: dict[int, Migration] = {1: _v1_visibility_inherits, 2: _v2_duplicate_of, 3: _v3_bundles}


def current_version(root: Path) -> int:
    layout = Layout(root)
    if not layout.settings_file.exists():
        return FORMAT_VERSION
    data = read_yaml(layout.settings_file) or {}
    return int(data.get("format_version", FORMAT_VERSION))


def migrate(
    root: Path,
    target: int = FORMAT_VERSION,
    migrations: dict[int, Migration] | None = None,
) -> list[int]:
    """Aplica as migrações em falta. Devolve as versões de origem aplicadas."""
    registry = MIGRATIONS if migrations is None else migrations
    layout = Layout(root)
    version = current_version(root)
    applied: list[int] = []
    while version < target:
        step = registry.get(version)
        if step is None:
            raise RuntimeError(f"não há migração do formato {version} para {version + 1}")
        step(root)
        applied.append(version)
        version += 1
        _set_format_version(layout.settings_file, version)
    return applied


def _set_format_version(path: Path, version: int) -> None:
    """Actualiza só a linha `format_version`, mantendo os comentários do `nexus.yaml`."""
    text = path.read_text(encoding="utf-8")
    updated, count = re.subn(r"(?m)^format_version:.*$", f"format_version: {version}", text)
    if count == 0:
        updated = f"format_version: {version}\n" + text
    if updated != text:
        path.write_text(updated, encoding="utf-8")
