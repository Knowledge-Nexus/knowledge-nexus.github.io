from __future__ import annotations

import subprocess
from pathlib import Path

from nexus.datarepo.git import Git


def test_push_logs_rejection_reason(tmp_path: Path, monkeypatch, caplog) -> None:
    stderr = b"! [rejected] HEAD -> main (fetch first)\n"

    def fake_run(*args, **kwargs):
        return subprocess.CompletedProcess(args[0], 1, b"", stderr)

    monkeypatch.setattr(subprocess, "run", fake_run)

    assert not Git(tmp_path).push()
    assert "fetch first" in caplog.text
