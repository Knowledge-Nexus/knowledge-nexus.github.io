"""`nexus servir`: substitui o workflow do GitHub Actions por um processo local.

Vigia o ramo `main` do repositório de dados; quando a interface deposita algo (ou há
alterações locais), corre o pipeline e publica os índices, como o workflow faria.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from pathlib import Path

from nexus.datarepo.git import Git, GitError
from nexus.publish import process_and_publish

log = logging.getLogger(__name__)


def remote_has_news(git: Git, remote: str, branch: str) -> bool:
    """Faz fetch e diz se o remoto tem commits que ainda não estão cá."""
    git.run("fetch", "-q", remote, branch)
    count = git.run("rev-list", "--count", f"HEAD..{remote}/{branch}", check=False)
    return count.strip().isdigit() and int(count) > 0


def serve_once(root: Path, remote: str = "origin", branch: str = "main",
               force: bool = False) -> bool:
    """Um ciclo. Devolve True se processou."""
    git = Git(root)
    news = remote_has_news(git, remote, branch)
    if not (news or force):
        return False
    if news:
        git.run("pull", "--rebase", "-q", remote, branch)
    result = process_and_publish(root, push=True, remote=remote, branch=branch)
    for line in result.report.summary():
        log.info(line)
    for note in result.notes:
        log.info(note)
    return True


def serve(root: Path, interval: int = 60, once: bool = False,
          sleep: Callable[[float], None] = time.sleep) -> None:
    """Corre até ser interrompido. Processa logo no arranque (apanha o que ficou por fazer)."""
    force = True
    while True:
        try:
            serve_once(root, force=force)
            force = False
        except GitError as exc:
            log.error("falhou, tenta de novo no próximo ciclo: %s", exc)
        except Exception:
            log.exception("erro inesperado, tenta de novo no próximo ciclo")
        if once:
            return
        sleep(interval)
