"""Fixtures comuns: repositório de dados temporário com catálogo fictício."""

from __future__ import annotations

import shutil
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests"))

from nexus import clock  # noqa: E402
from nexus.datarepo.catalog_io import import_bundle  # noqa: E402
from nexus.datarepo.layout import Layout  # noqa: E402
from nexus.datarepo.store import DataRepo  # noqa: E402
from nexus.datarepo.yamlio import read_yaml  # noqa: E402
from nexus.scaffold import scaffold  # noqa: E402

OWNER = "aluna"
FIXED_NOW = datetime(2025, 10, 1, 12, 0, tzinfo=UTC)


def has(tool: str) -> bool:
    return shutil.which(tool) is not None


requires_ocr = pytest.mark.skipif(not has("tesseract"), reason="Tesseract não instalado")
requires_soffice = pytest.mark.skipif(not has("soffice"), reason="LibreOffice não instalado")
requires_pandoc = pytest.mark.skipif(not has("pandoc"), reason="Pandoc não instalado")


@pytest.fixture(autouse=True)
def fixed_clock():
    with clock.fixed(FIXED_NOW):
        yield


@pytest.fixture(autouse=True)
def isolated_cache(tmp_path, monkeypatch):
    monkeypatch.setenv("NEXUS_CACHE_DIR", str(tmp_path / "cache"))


@pytest.fixture
def data_root(tmp_path: Path) -> Path:
    root = tmp_path / "dados"
    scaffold(root, OWNER)
    return root


@pytest.fixture
def catalog_root(data_root: Path) -> Path:
    import_bundle(Layout(data_root), read_yaml(ROOT / "config" / "catalogo" / "exemplo.yaml"))
    return data_root


@pytest.fixture
def git_root(catalog_root: Path, tmp_path: Path) -> Path:
    """Repositório de dados com git e um remoto bare (como o GitHub)."""
    remote = tmp_path / "remoto.git"
    run = lambda *a, cwd=catalog_root: subprocess.run(  # noqa: E731
        ["git", *a], cwd=cwd, check=True, capture_output=True)
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(remote)], check=True)
    run("init", "-q", "-b", "main")
    run("config", "user.name", "Teste")
    run("config", "user.email", "teste@example.invalid")
    run("remote", "add", "origin", str(remote))
    run("add", "-A")
    run("commit", "-q", "-m", "inicial")
    run("push", "-q", "origin", "main")
    return catalog_root


def deposit(root: Path, rel: str, owner: str = OWNER, batch: str = "20251001T100000Z-abcd") -> Path:
    path = root / "deposito" / owner / batch / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def repo(root: Path) -> DataRepo:
    return DataRepo(root)
