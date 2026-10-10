from __future__ import annotations

import subprocess
from pathlib import Path

from nexus.datarepo.git import Git
from nexus.serve import app_has_update, remote_has_news, serve, serve_once


def _git(cwd: Path, *args: str) -> None:
    subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args],
                   cwd=cwd, check=True, capture_output=True)


def test_remote_has_news_after_other_clone_pushes(tmp_path: Path) -> None:
    bare = tmp_path / "remote.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    a, b = tmp_path / "a", tmp_path / "b"
    subprocess.run(["git", "clone", "-q", str(bare), str(a)], check=True, capture_output=True)
    (a / "x.txt").write_text("1")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "um")
    _git(a, "push", "-q", "origin", "HEAD:main")
    subprocess.run(["git", "clone", "-q", str(bare), str(b)], check=True, capture_output=True)
    assert not remote_has_news(Git(b), "origin", "main")
    assert not serve_once(b)

    (a / "y.txt").write_text("2")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "dois")
    _git(a, "push", "-q", "origin", "HEAD:main")
    assert remote_has_news(Git(b), "origin", "main")


def test_serve_commits_skip_ci(git_root: Path) -> None:
    """O que o `nexus servir` envia já está processado: o push não corre o Actions."""
    from conftest import deposit

    from amostras import gerar

    gerar.pdf_nativo(deposit(git_root, "ficha.pdf"), gerar.FICHA_DESCONHECIDA)
    assert serve_once(git_root, force=True)
    messages = subprocess.run(["git", "log", "--format=%B", "-3"], cwd=git_root, check=True,
                              capture_output=True, text=True).stdout
    assert "nexus: processar depósito" in messages
    for message in messages.split("nexus:")[1:]:
        assert "[skip ci]" in message, message


def test_app_update_is_seen_only_when_pull_is_safe(tmp_path: Path) -> None:
    """O `nexus servir` reinicia quando a aplicação tem uma versão nova (o .bat faz pull)."""
    bare = tmp_path / "app.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    dev, local = tmp_path / "dev", tmp_path / "local"
    subprocess.run(["git", "clone", "-q", str(bare), str(dev)], check=True, capture_output=True)
    (dev / "pyproject.toml").write_text("[project]\n")
    _git(dev, "add", "-A")
    _git(dev, "commit", "-q", "-m", "um")
    _git(dev, "push", "-q", "origin", "HEAD:main")
    subprocess.run(["git", "clone", "-q", str(bare), str(local)], check=True,
                   capture_output=True)
    assert not app_has_update(local)
    (dev / "x.py").write_text("x = 1\n")
    _git(dev, "add", "-A")
    _git(dev, "commit", "-q", "-m", "dois")
    _git(dev, "push", "-q", "origin", "HEAD:main")
    assert app_has_update(local)
    (local / "pyproject.toml").write_text("[project]\nname = 'mexido'\n")
    assert not app_has_update(local), "com alterações locais o pull podia falhar"


def test_serve_stops_when_the_app_has_a_new_version(tmp_path: Path) -> None:
    sleeps: list[float] = []
    assert serve(tmp_path, interval=600, sleep=sleeps.append, has_update=lambda: True)
    assert sleeps == []
    assert not serve(tmp_path, once=True, has_update=lambda: True)
