"""Operações git mínimas sobre o repositório de dados (via CLI do git)."""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

BOT_NAME = "nexus-bot"
BOT_EMAIL = "nexus-bot@users.noreply.github.com"


class GitError(RuntimeError):
    pass


class Git:
    def __init__(self, root: Path) -> None:
        self.root = root

    def run(
        self,
        *args: str,
        check: bool = True,
        env: dict[str, str] | None = None,
        input_bytes: bytes | None = None,
    ) -> str:
        full_env = {**os.environ, **(env or {})}
        proc = subprocess.run(
            ["git", *args],
            cwd=self.root,
            env=full_env,
            input=input_bytes,
            capture_output=True,
            check=False,
        )
        if check and proc.returncode != 0:
            raise GitError(
                f"git {' '.join(args)} falhou ({proc.returncode}): "
                f"{proc.stderr.decode(errors='replace').strip()}"
            )
        return proc.stdout.decode(errors="replace").strip()

    def is_repo(self) -> bool:
        return (self.root / ".git").exists()

    def head(self) -> str | None:
        out = self.run("rev-parse", "--verify", "-q", "HEAD", check=False)
        return out or None

    def _identity(self) -> list[str]:
        name = self.run("config", "user.name", check=False)
        email = self.run("config", "user.email", check=False)
        args: list[str] = []
        if not name:
            args += ["-c", f"user.name={BOT_NAME}"]
        if not email:
            args += ["-c", f"user.email={BOT_EMAIL}"]
        return args

    def add_all(self) -> None:
        # --sparse permite adicionar ficheiros fora do sparse-checkout (ex.: originais/).
        self.run("add", "--sparse", "-A")

    def has_staged_changes(self) -> bool:
        proc = subprocess.run(
            ["git", "diff", "--cached", "--quiet"], cwd=self.root, check=False
        )
        return proc.returncode == 1

    def commit(self, message: str) -> str | None:
        self.add_all()
        if not self.has_staged_changes():
            return None
        self.run(*self._identity(), "commit", "-q", "-m", message)
        return self.head()

    def push(self, remote: str = "origin", branch: str = "main") -> bool:
        """Faz push; devolve False se for rejeitado por não ser fast-forward."""
        out = subprocess.run(
            ["git", "push", "-q", remote, f"HEAD:refs/heads/{branch}"],
            cwd=self.root,
            capture_output=True,
            check=False,
        )
        if out.returncode == 0:
            return True
        stderr = out.stderr.decode(errors="replace")
        if "rejected" in stderr or "non-fast-forward" in stderr or "fetch first" in stderr:
            return False
        raise GitError(f"git push falhou: {stderr.strip()}")

    def fetch_and_reset(self, remote: str = "origin", branch: str = "main") -> None:
        self.run("fetch", "-q", remote, branch)
        self.run("reset", "-q", "--hard", f"{remote}/{branch}")

    def publish_directory(
        self, directory: Path, branch: str, message: str, remote: str | None = "origin",
        env: dict[str, str] | None = None,
    ) -> str:
        """Publica `directory` como um ramo órfão de um só commit (reescrito a cada vez).

        Usa um índice temporário, por isso não toca na árvore de trabalho nem no HEAD.
        """
        with tempfile.TemporaryDirectory() as tmp:
            env = {"GIT_INDEX_FILE": str(Path(tmp) / "index")}
            self.run("--work-tree", str(directory), "add", "-A", "-f", ".", env=env)
            tree = self.run("write-tree", env=env)
        commit = self.run(*self._identity(), "commit-tree", tree, "-m", message)
        self.run("update-ref", f"refs/heads/{branch}", commit)
        if remote:
            self.run("push", "-q", "--force", remote, f"{commit}:refs/heads/{branch}", env=env)
        return commit

    def remote_url(self, remote: str = "origin") -> str | None:
        return self.run("remote", "get-url", remote, check=False) or None

    def show(self, rev: str, path: str) -> bytes:
        proc = subprocess.run(
            ["git", "show", f"{rev}:{path}"], cwd=self.root, capture_output=True, check=False
        )
        if proc.returncode != 0:
            raise GitError(proc.stderr.decode(errors="replace").strip())
        return proc.stdout

    def changed_paths(self, base: str, head: str = "HEAD") -> list[tuple[str, str]]:
        """Lista (estado, caminho) entre dois commits (A, M, D, R…)."""
        out = self.run("diff", "--name-status", "--no-renames", base, head)
        rows: list[tuple[str, str]] = []
        for line in out.splitlines():
            status, _, path = line.partition("\t")
            rows.append((status, path))
        return rows
