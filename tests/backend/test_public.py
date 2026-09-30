"""Visibilidade (por cadeira e por documento) e publicação do material público."""

from __future__ import annotations

import json
import sqlite3
import subprocess
from pathlib import Path

import pytest
from conftest import OWNER, deposit
from typer.testing import CliRunner

from amostras import gerar
from nexus import clock
from nexus.cli import app
from nexus.datarepo.layout import Layout
from nexus.datarepo.store import DataRepo
from nexus.datarepo.yamlio import read_yaml, write_yaml_if_changed
from nexus.domain.visibility import effective_visibility
from nexus.formats import migrate
from nexus.index.builder import META_DB, SEARCH_DB
from nexus.pipeline.run import Pipeline
from nexus.public import PublishError, build_public_site, publish_public
from nexus.sharing import set_document_visibility, set_unit_visibility


def _prepare(root: Path) -> DataRepo:
    gerar.pdf_nativo(deposit(root, "AM1/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    gerar.pdf_nativo(deposit(root, "ALGA/matrizes.pdf"), gerar.SLIDES_ALGA)
    Pipeline(DataRepo(root)).run()
    return DataRepo(root)


def _doc_of(repo: DataRepo, unit: str) -> str:
    return next(d.id for d in repo.documents.values() if d.classification.value("unit") == unit)


def _configure(root: Path, target: str = f"{OWNER}/estudo-publico") -> None:
    layout = Layout(root)
    data = read_yaml(layout.settings_file)
    data["publishing"] = {"public_repo": target}
    write_yaml_if_changed(layout.settings_file, data)


def test_effective_visibility_follows_unit_then_document(catalog_root: Path) -> None:
    repo = _prepare(catalog_root)
    am1 = _doc_of(repo, "ufe/am1")
    assert effective_visibility(repo.documents[am1], repo.users) == ("private", True)
    set_unit_visibility(repo, OWNER, "ufe/am1", "publico")
    repo = DataRepo(catalog_root)
    assert effective_visibility(repo.documents[am1], repo.users) == ("public", True)
    set_document_visibility(repo, am1, "privado")
    repo = DataRepo(catalog_root)
    assert effective_visibility(repo.documents[am1], repo.users) == ("private", False)
    set_document_visibility(repo, am1, "cadeira")
    assert DataRepo(catalog_root).documents[am1].visibility is None


def test_public_site_only_has_public_material_and_nothing_personal(
        catalog_root: Path, tmp_path: Path) -> None:
    repo = _prepare(catalog_root)
    am1 = _doc_of(repo, "ufe/am1")
    doc = repo.documents[am1].model_copy(update={"notes": "nota pessoal"})
    repo.save_document(doc)
    set_unit_visibility(repo, OWNER, "ufe/am1", "public")
    count, digest = build_public_site(DataRepo(catalog_root), tmp_path / "site")
    site = tmp_path / "site"
    assert count == 1
    con = sqlite3.connect(site / META_DB)
    rows = con.execute("SELECT id, notes, sources, source_path, history, visibility, "
                       "visibility_inherited FROM documents").fetchall()
    assert rows == [(am1, "", "[]", None, "[]", "public", 1)]
    assert [r[0] for r in con.execute("SELECT key FROM units")] == ["ufe/am1"]
    assert con.execute("SELECT count(*) FROM proposals").fetchone()[0] == 0
    assert con.execute("SELECT preferences, enrollments FROM users").fetchall() == [("{}", "{}")]
    classification = json.loads(con.execute("SELECT classification FROM documents").fetchone()[0])
    assert all("reasons" not in f for f in classification.values() if isinstance(f, dict))
    sha = doc.blob.sha256
    assert (site / "originais" / sha[:2] / f"{sha}.pdf").exists()
    assert (site / "texto" / sha / "paginas" / "0001.md").exists()
    alga_sha = repo.documents[_doc_of(repo, "ufe/alga")].blob.sha256
    assert not list((site / "originais").glob(f"*/{alga_sha}*"))
    search = sqlite3.connect(site / SEARCH_DB)
    assert {r[0] for r in search.execute("SELECT DISTINCT doc_id FROM pages_fts")} == {am1}
    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["scope"] == "public" and manifest["content_digest"] == digest

    # Determinístico: outra hora, o mesmo conteúdo → o mesmo resumo.
    from datetime import UTC, datetime
    with clock.fixed(datetime(2026, 1, 1, tzinfo=UTC)):
        _, again = build_public_site(DataRepo(catalog_root), tmp_path / "site2")
    assert again == digest


def test_publish_is_idempotent_and_unsharing_removes(git_root: Path, tmp_path: Path) -> None:
    remote = tmp_path / "publico.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(remote)], check=True)
    assert publish_public(git_root).configured is False
    repo = _prepare(git_root)
    set_unit_visibility(repo, OWNER, "ufe/am1", "public")
    _configure(git_root)

    first = publish_public(git_root, remote_url=str(remote))
    assert first.published and first.documents == 1
    second = publish_public(git_root, remote_url=str(remote))
    assert not second.published and "já actualizado" in second.notes[0]

    set_unit_visibility(DataRepo(git_root), OWNER, "ufe/am1", None)
    third = publish_public(git_root, remote_url=str(remote))
    assert third.published and third.documents == 0
    files = subprocess.run(["git", "ls-tree", "-r", "--name-only", "main"], cwd=remote,
                           check=True, capture_output=True, text=True).stdout.split()
    assert not any(f.startswith("originais/") for f in files)
    history = subprocess.run(["git", "rev-list", "--count", "main"], cwd=remote, check=True,
                             capture_output=True, text=True).stdout.strip()
    assert history == "1", "um único commit: o que deixou de ser público não fica no histórico"


def test_publish_refuses_the_data_repository(git_root: Path) -> None:
    subprocess.run(["git", "remote", "set-url", "origin",
                    f"https://github.com/{OWNER}/estudo-dados.git"], cwd=git_root, check=True)
    _configure(git_root, f"{OWNER}/Estudo-Dados")
    with pytest.raises(PublishError):
        publish_public(git_root, push=False)
    _configure(git_root, "Knowledge-Nexus/knowledge-nexus.github.io")
    with pytest.raises(PublishError):
        publish_public(git_root, push=False)


def test_migration_1_to_2_makes_default_private_inherit(catalog_root: Path) -> None:
    repo = _prepare(catalog_root)
    layout = Layout(catalog_root)
    am1 = _doc_of(repo, "ufe/am1")
    path = layout.document_path(am1)
    data = read_yaml(path)
    data["visibility"] = "private"
    write_yaml_if_changed(path, data)
    settings = read_yaml(layout.settings_file)
    settings["format_version"] = 1
    write_yaml_if_changed(layout.settings_file, settings)
    assert migrate(catalog_root) == [1]
    assert "visibility" not in read_yaml(path)


def test_cli_visibility(catalog_root: Path) -> None:
    repo = _prepare(catalog_root)
    runner = CliRunner()
    out = runner.invoke(app, ["visibilidade", "cadeira", "ufe/am1", "publico",
                              "--repo", str(catalog_root)])
    assert out.exit_code == 0, out.output
    assert read_yaml(Layout(catalog_root).user_path(OWNER))["sharing"]["units"] == {
        "ufe/am1": "public"}
    doc = _doc_of(repo, "ufe/alga")
    out = runner.invoke(app, ["visibilidade", "documento", doc, "publico",
                              "--repo", str(catalog_root)])
    assert out.exit_code == 0 and DataRepo(catalog_root).documents[doc].visibility == "public"
    bad = runner.invoke(app, ["visibilidade", "documento", doc, "toda-a-gente",
                              "--repo", str(catalog_root)])
    assert bad.exit_code == 1
