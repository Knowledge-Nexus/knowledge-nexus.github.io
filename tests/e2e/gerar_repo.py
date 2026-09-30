"""Gera um repositório de dados FICTÍCIO, processado pelo motor real, para os testes E2E.

Uso: uv run python tests/e2e/gerar_repo.py <saida.json>

O JSON tem os ficheiros do ramo `main` e do ramo `indices` (em base64); o Playwright
serve-os através de um GitHub simulado (frontend/src/data/github/fake.ts).
"""

from __future__ import annotations

import base64
import json
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests"))

from amostras import gerar  # noqa: E402
from nexus import clock  # noqa: E402
from nexus.datarepo.catalog_io import import_bundle  # noqa: E402
from nexus.datarepo.store import DataRepo  # noqa: E402
from nexus.datarepo.yamlio import read_yaml  # noqa: E402
from nexus.index.builder import build_indices  # noqa: E402
from nexus.pipeline.run import Pipeline  # noqa: E402
from nexus.scaffold import scaffold  # noqa: E402

OWNER = "aluna"


def _files(root: Path) -> dict[str, str]:
    return {
        p.relative_to(root).as_posix(): base64.b64encode(p.read_bytes()).decode()
        for p in sorted(root.rglob("*"))
        if p.is_file() and ".git" not in p.parts
    }


def build(out: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp, clock.fixed(datetime(2025, 10, 1, tzinfo=UTC)):
        root = Path(tmp) / "dados"
        scaffold(root, OWNER)
        import_bundle(DataRepo(root).layout,
                      read_yaml(ROOT / "config" / "catalogo" / "exemplo.yaml"))
        gerar.pasta_exemplo(root / "deposito" / OWNER)
        Pipeline(DataRepo(root)).run()
        indices = Path(tmp) / "indices"
        build_indices(DataRepo(root), indices, built_from="e2e")
        data = {"owner": OWNER, "main": _files(root), "indices": _files(indices)}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data), encoding="utf-8")


if __name__ == "__main__":
    build(Path(sys.argv[1] if len(sys.argv) > 1 else "frontend/test-fixtures/e2e/repo.json"))
