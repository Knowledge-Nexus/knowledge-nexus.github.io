"""Gera o índice de contrato: um repositório de dados fictício processado pelo motor real.

Uso: uv run python tests/contrato/gerar_indice.py <pasta-de-saida>

Escreve meta.db, pesquisa.db, manifest.json e esperado.json (resultados de referência
calculados em Python) para o frontend verificar que lê o mesmo esquema e obtém os mesmos
resultados de pesquisa (frontend/src/data/sqlite/contract.test.ts).
"""

from __future__ import annotations

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
from nexus.index.builder import SEARCH_DB, build_indices  # noqa: E402
from nexus.index.search import SqliteFtsSearch  # noqa: E402
from nexus.pipeline.run import Pipeline  # noqa: E402
from nexus.scaffold import scaffold  # noqa: E402

OWNER = "aluna"
QUERIES = ["sucessao", "Ano Letivo", "determinante", "grafo", "derivada primitiva"]


def build(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp, clock.fixed(datetime(2025, 10, 1, tzinfo=UTC)):
        root = Path(tmp) / "dados"
        scaffold(root, OWNER)
        import_bundle(DataRepo(root).layout,
                      read_yaml(ROOT / "config" / "catalogo" / "exemplo.yaml"))
        gerar.pasta_exemplo(root / "deposito" / OWNER)
        gerar.pdf_nativo(root / "deposito" / OWNER / "exemplo" / "AM1" / "slides_limites.pdf",
                         gerar.SLIDES_ALGA)
        Pipeline(DataRepo(root)).run()
        repo = DataRepo(root)
        build_indices(repo, out, built_from="contrato")
        search = SqliteFtsSearch(out / SEARCH_DB)
        expected = {
            "owner": OWNER,
            "documents": sorted(d.id for d in repo.documents.values()),
            "review": sorted(d.id for d in repo.documents.values() if d.needs_review),
            "search": {q: [[h.doc_id, h.page] for h in search.search(q, OWNER)]
                       for q in QUERIES},
            "search_other_viewer": [[h.doc_id, h.page] for h in search.search("sucessao", "x")],
        }
        (out / "esperado.json").write_text(json.dumps(expected, indent=2), encoding="utf-8")
        _previous_schema(out)


def _previous_schema(out: Path) -> None:
    """Cópia no esquema 3 (sem as colunas dos conjuntos): a interface tem de continuar a ler
    os índices antigos até o repositório de dados voltar a ser processado."""
    import shutil
    import sqlite3

    target = out / "meta-v3.db"
    shutil.copyfile(out / "meta.db", target)
    con = sqlite3.connect(target)
    for column in ("bundle_id", "bundle_name", "bundle_method", "bundle_lead"):
        con.execute(f"ALTER TABLE documents DROP COLUMN {column}")
    con.execute("UPDATE meta SET value = '3' WHERE key = 'schema_version'")
    con.commit()
    con.close()


if __name__ == "__main__":
    build(Path(sys.argv[1] if len(sys.argv) > 1 else "frontend/test-fixtures/contrato"))
