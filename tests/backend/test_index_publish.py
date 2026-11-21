from __future__ import annotations

import gzip
import json
import sqlite3
import subprocess
from pathlib import Path

from conftest import OWNER, deposit
from typer.testing import CliRunner

from amostras import gerar
from nexus.cli import app
from nexus.datarepo.store import DataRepo
from nexus.index.builder import META_DB, build_indices
from nexus.index.schema import SCHEMA_VERSION
from nexus.index.search import (
    HIGHLIGHT_START,
    PageRow,
    SearchFilters,
    SqliteFtsSearch,
    build_match,
)
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
    search = SqliteFtsSearch.from_dir(tmp_path)
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
    shards = manifest["search"]["shards"]
    assert shards == [f"pesquisa-{i:02x}.db.gz" for i in range(16)]
    assert set(manifest["files"]) == {META_DB, *shards}
    assert not (tmp_path / ".pesquisa.db").exists()
    for name in shards:
        assert gzip.decompress((tmp_path / name).read_bytes()).startswith(b"SQLite format 3")


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
    assert files == ["manifest.json", "meta.db", *[f"pesquisa-{i:02x}.db.gz" for i in range(16)]]
    assert git("rev-list", "--count", "indices", cwd=Path(remote)) == "1"
    log = git("log", "--format=%s", cwd=git_root).splitlines()
    assert log[0].startswith("nexus: processar depósito (1 novos")
    assert log[1] == "nexus: alterações locais antes de processar"

    again = process_and_publish(git_root)
    assert again.commit is None and "índices já actualizados" in again.notes


def test_process_and_publish_commits_and_indexes_each_batch(
    git_root: Path,
) -> None:
    gerar.pdf_nativo(deposit(git_root, "a.pdf"), gerar.EXAME_AM1)
    gerar.pdf_nativo(deposit(git_root, "b.pdf"), gerar.SLIDES_ALGA)
    gerar.pdf_nativo(deposit(git_root, "c.pdf"), gerar.FICHA_DESCONHECIDA)

    first = process_and_publish(git_root, max_items=2)

    assert first.pushed and first.commit
    assert first.report.processed_items == 2
    assert first.report.remaining_items
    assert first.indices_commit
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


def _row(sha: str, text: str, page: int = 1) -> PageRow:
    return PageRow(text=text, doc_id=f"doc-{sha[:6]}", sha256=sha, page=page, owner=OWNER,
                   visibility="private", unit=None, course=None, document_type=None,
                   academic_year=None, title=f"t{sha[:4]}")


def test_search_shards_are_stable_and_split_when_too_big(tmp_path: Path, monkeypatch) -> None:
    from nexus.index import search as search_module
    from nexus.index.search import SqliteFtsSearch, shard_of, write_search_shards

    rows = [_row(f"{i:x}" * 64, f"Página sobre o assunto número {i} e a sucessão") for i in
            range(16)]
    meta = {"search_schema_version": "2", "scope": "private"}
    first, second = tmp_path / "a", tmp_path / "b"
    first.mkdir()
    second.mkdir()
    names = write_search_shards(first, rows, meta)
    # Outra página num documento: só a parte desse documento muda.
    changed = [*rows, _row(rows[3].sha256, "Mais uma página do mesmo documento", 2)]
    assert write_search_shards(second, changed, meta) == names
    differ = [n for n in names if (first / n).read_bytes() != (second / n).read_bytes()]
    assert differ == [names[shard_of(rows[3].sha256, 16)]]

    # O texto normalizado só está no índice: a tabela das páginas não o guarda.
    import gzip
    import sqlite3

    raw = tmp_path / "parte.db"
    raw.write_bytes(gzip.decompress((first / names[0]).read_bytes()))
    con = sqlite3.connect(raw)
    assert con.execute("SELECT count(*) FROM pages WHERE norm <> ''").fetchone()[0] == 0
    con.close()

    # Uma parte acima do limite dobra o número de partes. Dois documentos que a 16 partes
    # ficam juntos (0x0000 e 0x0010) separam-se a 32.
    long_text = " ".join(f"palavra{i} sucessão" for i in range(400))
    pair = [_row("0000" + "a" * 60, long_text), _row("0010" + "b" * 60, long_text)]
    alone = tmp_path / "sozinho"
    alone.mkdir()
    single = write_search_shards(alone, pair[:1], meta)
    limit = (alone / single[0]).stat().st_size + 200
    monkeypatch.setattr(search_module, "MAX_SHARD_BYTES", limit)
    third = tmp_path / "c"
    third.mkdir()
    more = write_search_shards(third, pair, meta)
    assert len(more) == 32 and all((third / n).stat().st_size <= limit for n in more)
    (third / "manifest.json").write_text(json.dumps({"search": {"shards": more}}))
    hits = SqliteFtsSearch.from_dir(third).search("sucessao", OWNER, limit=100)
    assert sorted(h.doc_id for h in hits) == sorted(r.doc_id for r in pair)
