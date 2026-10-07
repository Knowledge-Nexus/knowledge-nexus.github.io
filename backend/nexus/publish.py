"""Processar + commit + push (com novas tentativas) + publicar o ramo `indices`."""

from __future__ import annotations

import json
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from nexus.datarepo.git import Git, GitError
from nexus.datarepo.store import DataRepo
from nexus.index.builder import MANIFEST, build_indices
from nexus.pipeline.run import Pipeline, RunReport

INDICES_BRANCH = "indices"


@dataclass
class ProcessResult:
    report: RunReport
    commit: str | None = None
    pushed: bool = False
    attempts: int = 0
    indices_commit: str | None = None
    notes: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["report"] = asdict(self.report)
        return data


def commit_message(report: RunReport) -> str:
    return (f"nexus: processar depósito ({len(report.new_documents)} novos, "
            f"{len(report.filed)} arrumados, {len(report.review)} a rever, "
            f"{len(report.errors)} erros)")


def _remote_indices_source(git: Git, remote: str) -> str | None:
    try:
        git.run("fetch", "-q", remote, INDICES_BRANCH)
        manifest = json.loads(git.show("FETCH_HEAD", MANIFEST))
    except (GitError, json.JSONDecodeError):
        return None
    value = manifest.get("built_from")
    return str(value) if value else None


def publish_index_branch(root: Path, push: bool = True, remote: str = "origin") -> str | None:
    """Reconstrói e publica os índices do estado actual do repositório."""
    git = Git(root)
    use_git = git.is_repo()
    head = git.head() if use_git else None
    with tempfile.TemporaryDirectory(prefix="nexus-indices-") as tmp:
        build_indices(DataRepo(root), Path(tmp), built_from=head)
        if not use_git:
            return None
        return git.publish_directory(
            Path(tmp), INDICES_BRANCH, f"nexus: índices de {head or 'trabalho local'}",
            remote=remote if push else None)


def process_and_publish(root: Path, push: bool = True, reclassify: bool = False,
                        publish_indices: bool = True, remote: str = "origin",
                        branch: str = "main", max_attempts: int = 3,
                        max_items: int | None = None) -> ProcessResult:
    """Corre o pipeline e publica. Nunca perde ficheiros locais:

    1. alterações locais por registar (ex.: ficheiros largados no depósito de um clone)
       são primeiro guardadas num commit próprio;
    2. se o push for rejeitado (o remoto avançou), o commit do pipeline é descartado, o
       commit local é reposto sobre o remoto (rebase) e o pipeline corre de novo: é
       idempotente e reaproveita a cache de extracção.
    """
    git = Git(root)
    use_git = git.is_repo()
    result = ProcessResult(report=RunReport())
    if use_git:
        local = git.commit("nexus: alterações locais antes de processar")
        if local:
            result.notes.append(f"alterações locais guardadas em {local[:10]}")
    for attempt in range(1, max_attempts + 1):
        result.attempts = attempt
        base = git.head() if use_git else None
        result.report = Pipeline(
            DataRepo(root), reclassify_all=reclassify, max_items=max_items
        ).run()
        if not use_git:
            break
        result.commit = git.commit(commit_message(result.report))
        if not push:
            break
        if git.push(remote, branch):
            result.pushed = True
            break
        result.notes.append(f"push rejeitado (tentativa {attempt}); a sincronizar com {remote}")
        git.run("fetch", "-q", remote, branch)
        git.run("reset", "-q", "--hard", base or f"{remote}/{branch}")
        try:
            git.run("rebase", "-q", f"{remote}/{branch}")
        except GitError as exc:
            git.run("rebase", "--abort", check=False)
            raise GitError(
                "as alterações locais entram em conflito com o remoto; resolve com "
                "`git pull --rebase` e corre de novo (nada foi perdido)"
            ) from exc
    else:
        raise GitError("não foi possível publicar depois de várias tentativas")

    if publish_indices:
        head = git.head() if use_git else None
        if use_git and push and result.commit is None and head and \
                _remote_indices_source(git, remote) == head:
            result.notes.append("índices já actualizados")
            return result
        result.indices_commit = publish_index_branch(root, push=push, remote=remote)
    return result
