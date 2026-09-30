from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from nexus.github.api import Repo
from nexus.github.watch import ERRORS_DIR, SENT_DIR, STATE_FILE, Watcher, WatchState


class FakeApi:
    def __init__(self) -> None:
        self.remote: dict[str, bytes] = {}
        self.commits: list[str] = []

    def user(self) -> str:
        return "aluna"

    def repo_info(self, repo: Repo) -> dict[str, Any]:
        return {"private": True, "default_branch": "main"}

    def list_dir(self, repo: Repo, path: str) -> list[str] | None:
        prefix = path.rstrip("/") + "/"
        names = {p[len(prefix):].split("/", 1)[0] for p in self.remote if p.startswith(prefix)}
        return sorted(names) or None

    def commit_files(self, repo: Repo, files: dict[str, bytes], message: str) -> str:
        self.remote.update(files)
        self.commits.append(message)
        return f"c{len(self.commits)}"

    def pipeline(self, fail: set[str] = frozenset()) -> None:  # type: ignore[assignment]
        """Simula o pipeline: esvazia o depósito, movendo as falhas para _erros."""
        for path in list(self.remote):
            if not path.startswith("deposito/aluna/") or "/_erros/" in path:
                continue
            data = self.remote.pop(path)
            batch, rel = path.split("/", 3)[2:]
            if rel.split("/", 1)[0] in fail:
                self.remote[f"deposito/aluna/{ERRORS_DIR}/{batch}/{rel}"] = data


def test_watcher_sends_once_and_settles_after_pipeline(tmp_path: Path) -> None:
    folder = tmp_path / "Deposito"
    (folder / "AM1").mkdir(parents=True)
    (folder / "AM1" / "exame.pdf").write_bytes(b"%PDF-1.4")
    (folder / "partido.pdf").write_bytes(b"nada")
    (folder / "Thumbs.db").write_bytes(b"lixo")
    api = FakeApi()
    watcher = Watcher(folder, api, Repo("aluna", "dados"), "aluna", stable_seconds=0)

    entry = watcher.send_new()
    assert entry is not None and sorted(entry.files) == ["AM1/exame.pdf", "partido.pdf"]
    assert len(api.commits) == 1
    assert watcher.send_new() is None, "não reenvia o que está pendente"
    assert (folder / "AM1" / "exame.pdf").exists(), "só sai depois de processado"
    assert watcher.settle() == []

    api.pipeline(fail={"partido.pdf"})
    moved = dict(watcher.settle())
    assert moved == {"AM1/exame.pdf": SENT_DIR, "partido.pdf": ERRORS_DIR}
    assert (folder / SENT_DIR / entry.batch / "AM1" / "exame.pdf").exists()
    assert (folder / ERRORS_DIR / entry.batch / "partido.pdf").exists()
    assert not (folder / "AM1").exists()
    assert WatchState.load(folder).pending == []
    assert (folder / STATE_FILE).exists()


def test_large_files_are_sent_in_parts() -> None:
    import hashlib

    from nexus.github.watch import PART_BYTES, split_for_upload

    data = bytes(range(256)) * (PART_BYTES // 256 * 2 + 10)
    out = split_for_upload("deposito/a/b/grande.pdf", "grande.pdf", data)
    parts = sorted(k for k in out if ".nexus-part-" in k)
    assert len(parts) == 3 and b"".join(out[k] for k in parts) == data
    manifest = yaml.safe_load(out["deposito/a/b/grande.pdf.nexus-parts.yaml"])
    assert manifest == {"path": "grande.pdf", "size": len(data), "parts": 3,
                        "sha256": hashlib.sha256(data).hexdigest()}
    assert split_for_upload("x", "x", b"pequeno") == {"x": b"pequeno"}
