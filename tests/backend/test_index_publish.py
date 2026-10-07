from __future__ import annotations

import json
import sqlite3
import subprocess
from pathlib import Path

from conftest import OWNER, deposit
from typer.testing import CliRunner

from amostras import gerar
from nexus.cli import app
from nexus.datarepo.store import DataRepo
from nexus.index.builder import META_DB, SEARCH_DB, build_indices
from nexus.index.schema import SCHEMA_VERSION
from nexus.index.search import HIGHLIGHT_START, SearchFilters, SqliteFtsSearch, build_match
from nexus.pipeline.run import Pipeline
from nexus.publish import process_and_publish


def git(*args: str, cwd: Path) -> str:
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True,
                          text=True).stdout.strip()


def _prepare(root: Path) -> None:
    gerar.pdf_nativo(deposit(root, "AM1/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    gerar.pdf_nativo(deposit(root, "ALGA/matrizes.pdf"), gerar.SLIDES_ALGA)
    Pipeline(DataRepo(root)).run()


def test_build_match_is_safe() -> None:
    assert build_match('limite" OR x*') == '{text norm} : ("limite"* AND "or"* AND "x"*)'
    assert build_match("  ") is None


def test_search_accents_spelling_and_filters(catalog_root: Path, tmp_path: Path) -> None:
    _prepare(catalog_root)
    build_indices(DataRepo(catalog_root), tmp_path)
    search = SqliteFtsSearch(tmp_path / SEARCH_DB)
    hits = search.search("sucessao", OWNER)
    assert hits and hits[0].page == 1 and HIGHLIGHT_START in hits[0].snippet
    assert search.search("Ano Letivo", OWNER), "grafia AO90 encontra texto pré-AO"
    assert search.search("determin", OWNER, SearchFilters(unit="ufe/alga"))
    assert not search.search("determinante", OWNER, SearchFilters(unit="ufe/am1"))
    assert not search.search("sucessao", "outra-pessoa"), "privado só para o dono"


def test_meta_db_contents(catalog_root: Path, tmp_path: Path) -> None:
    _prepare(catalog_root)
    build_indices(DataRepo(catalog_root), tmp_path, built_from="abc")
    con = sqlite3.connect(tmp_path / META_DB)
    meta = dict(con.execute("SELECT key, value FROM meta"))
    assert meta["built_from"] == "abc" and meta["schema_version"] == str(SCHEMA_VERSION)
    rows = con.execute("SELECT unit, course, document_type, status FROM documents "
                       "ORDER BY unit").fetchall()
    assert ("ufe/am1", "ufe/lei", "enunciados-avaliacao", "filed") in rows
    assert con.execute("SELECT count(*) FROM vocab_terms WHERE kind='document_types'"
                       ).fetchone()[0] >= 12
    manifest = json.loads((tmp_path / "manifest.json").read_text())
    assert set(manifest["files"]) == {META_DB, SEARCH_DB}


def test_alembic_baseline_matches_schema(tmp_path: Path) -> None:
    from alembic import command
    from alembic.autogenerate import compare_metadata
    from alembic.migration import MigrationContext
    from sqlalchemy import create_engine

    from nexus.index import schema
    from nexus.index.migrations import alembic_config

    url = f"sqlite:///{tmp_path / 'server.db'}"
    command.upgrade(alembic_config(url), "head")
    engine = create_engine(url)
    with engine.connect() as con:
        diff = compare_metadata(MigrationContext.configure(con), schema.metadata)
    assert diff == []


def test_process_and_publish_with_git(git_root: Path) -> None:
    gerar.pdf_nativo(deposit(git_root, "AM1/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    result = process_and_publish(git_root)
    assert result.pushed and result.commit and result.indices_commit
    remote = git("remote", "get-url", "origin", cwd=git_root)
    assert git("rev-parse", "main", cwd=Path(remote)) == git("rev-parse", "HEAD", cwd=git_root)
    files = git("ls-tree", "--name-only", "indices", cwd=Path(remote)).split()
    assert files == ["manifest.json", "meta.db", "pesquisa.db"]
    assert git("rev-list", "--count", "indices", cwd=Path(remote)) == "1"
    log = git("log", "--format=%s", cwd=git_root).splitlines()
    assert log[0].startswith("nexus: processar depósito (1 novos")
    assert log[1] == "nexus: alterações locais antes de processar"

    again = process_and_publish(git_root)
    assert again.commit is None and "índices já actualizados" in again.notes


def test_process_and_publish_commits_batches_and_indexes_only_at_the_end(
    git_root: Path,
) -> None:
    gerar.pdf_nativo(deposit(git_root, "a.pdf"), gerar.EXAME_AM1)
    gerar.pdf_nativo(deposit(git_root, "b.pdf"), gerar.SLIDES_ALGA)
    gerar.pdf_nativo(deposit(git_root, "c.pdf"), gerar.FICHA_DESCONHECIDA)

    first = process_and_publish(git_root, max_items=2)

    assert first.pushed and first.commit
    assert first.report.processed_items == 2
    assert first.report.remaining_items
    assert first.indices_commit is None
    assert len(list((git_root / "deposito").rglob("*.pdf"))) == 1

    second = process_and_publish(git_root, max_items=2)

    assert second.pushed and second.commit
    assert second.report.processed_items == 1
    assert not second.report.remaining_items
    assert second.indices_commit
    assert len(DataRepo(git_root).documents) == 3
    assert not list((git_root / "deposito").rglob("*.pdf"))


def test_push_rejected_is_retried_without_losing_files(git_root: Path, tmp_path: Path) -> None:
    remote = git("remote", "get-url", "origin", cwd=git_root)
    other = tmp_path / "outro-clone"
    subprocess.run(["git", "clone", "-q", remote, str(other)], check=True)
    gerar.pdf_nativo(deposit(other, "ALGA/matrizes.pdf"), gerar.SLIDES_ALGA)
    git("-c", "user.name=x", "-c", "user.email=x@x", "add", "-A", cwd=other)
    git("-c", "user.name=x", "-c", "user.email=x@x", "commit", "-qm", "outro envio", cwd=other)
    git("push", "-q", "origin", "main", cwd=other)

    gerar.pdf_nativo(deposit(git_root, "AM1/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    result = process_and_publish(git_root)
    assert result.pushed and result.attempts == 2
    names = {d.display_name for d in DataRepo(git_root).documents.values()}
    assert "2023-2024_exame-recurso-2024-02-05-enunciado.pdf" in names
    assert any("matrizes" in n for n in names), "o ficheiro enviado pelo outro clone também"


def test_cli_end_to_end(catalog_root: Path, tmp_path: Path) -> None:
    runner = CliRunner()
    gerar.pdf_nativo(deposit(catalog_root, "grafos_ficha2.pdf"), gerar.FICHA_DESCONHECIDA)
    out = runner.invoke(app, ["processar", "--repo", str(catalog_root), "--json"])
    assert out.exit_code == 0, out.output
    data = json.loads(out.output)
    assert data["report"]["review"]
    listing = runner.invoke(app, ["revisao", "listar", "--repo", str(catalog_root), "--json"])
    [item] = json.loads(listing.output)
    text = runner.invoke(app, ["documento", "texto", item["id"][:8], "--repo",
                               str(catalog_root), "--paginas", "1"])
    assert "Teoria dos Grafos" in text.output
    accepted = runner.invoke(app, ["catalogo", "aceitar", "unit-teoria-dos-grafos-imaginarios",
                                   "--repo", str(catalog_root), "--slug", "tgi"])
    assert accepted.exit_code == 0, accepted.output
    runner.invoke(app, ["processar", "--repo", str(catalog_root)])
    [doc] = DataRepo(catalog_root).documents.values()
    assert doc.classification.value("unit") == "ufe/tgi"
    assert not doc.needs_review
    found = runner.invoke(app, ["pesquisar", "arvore abrangente", "--repo", str(catalog_root)])
    assert "p.1" in found.output
    exported = runner.invoke(app, ["exportar-arvore", str(tmp_path / "arv"), "--repo",
                                   str(catalog_root)])
    assert "1 ficheiros exportados" in exported.output
