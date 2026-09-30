"""Armazenamento de originais endereçados por conteúdo (SHA-256).

Fase 1: `GitRepoBlobStore` guarda em `originais/<aa>/<sha>.<ext>` no repositório de dados.
Fase 5: uma implementação S3 com a mesma interface.
"""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Protocol

from nexus.datarepo.git import Git, GitError
from nexus.datarepo.layout import Layout


class BlobStore(Protocol):
    def exists(self, sha256: str) -> bool: ...

    def put(self, source: Path, sha256: str, ext: str, move: bool) -> None: ...

    def materialize(self, sha256: str, ext: str, dest_dir: Path) -> Path: ...


class GitRepoBlobStore:
    def __init__(self, layout: Layout) -> None:
        self.layout = layout
        self.git = Git(layout.root)
        self._tracked: set[str] | None = None

    def _tracked_shas(self) -> set[str]:
        """SHAs registados no git (inclui os fora do sparse-checkout)."""
        if self._tracked is None:
            self._tracked = set()
            if self.git.is_repo():
                out = self.git.run("ls-files", "--sparse", "--", "originais", check=False)
                for line in out.splitlines():
                    self._tracked.add(Path(line).name.split(".", 1)[0])
        return self._tracked

    def exists(self, sha256: str) -> bool:
        return self.layout.find_original(sha256) is not None or sha256 in self._tracked_shas()

    def put(self, source: Path, sha256: str, ext: str, move: bool) -> None:
        """Guarda o original. Se já existir, não toca no que lá está (imutável)."""
        if self.exists(sha256):
            if move:
                source.unlink()
            return
        target = self.layout.original_path(sha256, ext)
        target.parent.mkdir(parents=True, exist_ok=True)
        if move:
            shutil.move(source, target)
        else:
            shutil.copyfile(source, target)
        target.chmod(0o444)
        self._tracked_shas().add(sha256)

    def materialize(self, sha256: str, ext: str, dest_dir: Path) -> Path:
        found = self.layout.find_original(sha256)
        if found is not None:
            return found
        rel = self.layout.relative(self.layout.original_path(sha256, ext))
        try:
            data = self.git.show("HEAD", rel)
        except GitError as exc:
            raise FileNotFoundError(f"original {sha256} não encontrado") from exc
        dest_dir.mkdir(parents=True, exist_ok=True)
        target = dest_dir / Path(rel).name
        target.write_bytes(data)
        return target
