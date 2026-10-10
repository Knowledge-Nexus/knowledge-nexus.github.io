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

# Código de saída quando há uma versão nova da aplicação: o `vigiar-deposito.bat` faz
# `git pull` e volta a arrancar (antes, o processo continuava com o código antigo até alguém
# o reiniciar à mão).
UPDATE_EXIT = 75
# De quanto em quanto tempo (segundos) se vê se a aplicação tem uma versão nova.
UPDATE_EVERY = 600


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
    # O resultado já vem processado: o push não deve pôr o Actions a fazê-lo outra vez.
    result = process_and_publish(root, push=True, remote=remote, branch=branch, skip_ci=True)
    for line in result.report.summary():
        log.info(line)
    for note in result.notes:
        log.info(note)
    return True


def app_checkout() -> Path | None:
    """A cópia git da aplicação de onde o `nexus` corre (None se foi instalado de outra forma)."""
    for parent in Path(__file__).resolve().parents:
        if (parent / ".git").exists() and (parent / "pyproject.toml").exists():
            return parent
    return None


def app_has_update(checkout: Path) -> bool:
    """O remoto da aplicação tem commits novos que um `git pull` traz sem conflitos."""
    git = Git(checkout)
    if git.run("status", "--porcelain", "--untracked-files=no", check=False).strip():
        return False  # alterações locais: o pull podia falhar e reiniciava sem fim
    branch = git.run("rev-parse", "--abbrev-ref", "HEAD", check=False).strip()
    if not branch or branch == "HEAD":
        return False
    return remote_has_news(git, "origin", branch)


def serve(root: Path, interval: int = 60, once: bool = False,
          sleep: Callable[[float], None] = time.sleep,
          has_update: Callable[[], bool] | None = None) -> bool:
    """Corre até ser interrompido. Processa logo no arranque (apanha o que ficou por fazer).
    Devolve True quando pára porque a aplicação tem uma versão nova (`UPDATE_EXIT`)."""
    if has_update is None:
        checkout = app_checkout()
        has_update = (lambda: app_has_update(checkout)) if checkout else (lambda: False)
    every = max(1, UPDATE_EVERY // max(interval, 1))
    force = True
    cycle = 0
    while True:
        try:
            serve_once(root, force=force)
            force = False
        except GitError as exc:
            log.error("falhou, tenta de novo no próximo ciclo: %s", exc)
        except Exception:
            log.exception("erro inesperado, tenta de novo no próximo ciclo")
        if once:
            return False
        cycle += 1
        if cycle % every == 0:
            try:
                if has_update():
                    log.info("há uma versão nova do Knowledge Nexus: a reiniciar para a usar")
                    return True
            except GitError as exc:
                log.warning("não deu para ver se há uma versão nova: %s", exc)
        sleep(interval)
