from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from nexus.storage.r2 import QuotaExceeded, R2BlobStore


class _NotFound(Exception):
    def __init__(self) -> None:
        self.response = {"Error": {"Code": "404"}}


class FakeS3:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    def head_object(self, Bucket: str, Key: str) -> dict[str, Any]:
        if Key not in self.objects:
            raise _NotFound()
        return {"ContentLength": len(self.objects[Key])}

    def upload_file(self, path: str, bucket: str, key: str) -> None:
        self.objects[key] = Path(path).read_bytes()

    def download_file(self, bucket: str, key: str, path: str) -> None:
        Path(path).write_bytes(self.objects[key])

    def list_objects_v2(self, **kwargs: Any) -> dict[str, Any]:
        return {"Contents": [{"Key": k, "Size": len(v)} for k, v in self.objects.items()]}


def _file(tmp_path: Path, name: str, size: int) -> Path:
    p = tmp_path / name
    p.write_bytes(b"x" * size)
    return p


def test_put_materialize_and_dedup(tmp_path: Path) -> None:
    store = R2BlobStore("b", 100, FakeS3())
    src = _file(tmp_path, "a.pdf", 10)
    store.put(src, "a" * 64, "pdf", move=True)
    assert not src.exists()
    assert store.exists("a" * 64)
    out = store.materialize("a" * 64, "pdf", tmp_path / "out")
    assert out.read_bytes() == b"x" * 10
    store.put(_file(tmp_path, "b.pdf", 10), "a" * 64, "pdf", move=False)  # igual: não conta
    assert store.used_bytes() == 10


def test_hard_cut_when_over_limit(tmp_path: Path) -> None:
    s3 = FakeS3()
    store = R2BlobStore("b", 25, s3)
    store.put(_file(tmp_path, "a", 10), "1" * 64, "pdf", move=False)
    store.put(_file(tmp_path, "b", 10), "2" * 64, "pdf", move=False)
    with pytest.raises(QuotaExceeded):
        store.put(_file(tmp_path, "c", 10), "3" * 64, "pdf", move=False)
    assert "blobs/" + "3" * 64 not in s3.objects
    # outro processo (cache vazia) vê o mesmo total real do bucket
    assert R2BlobStore("b", 25, s3).used_bytes() == 20


def test_migrate_originals(tmp_path: Path) -> None:
    import hashlib

    from nexus.datarepo.layout import Layout
    from nexus.storage.migrate import migrate_originals

    layout = Layout(tmp_path)
    data = {b"um" * 5: "pdf", b"dois" * 5: "docx"}
    for content, ext in data.items():
        sha = hashlib.sha256(content).hexdigest()
        p = layout.original_path(sha, ext)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(content)
    bad = layout.original_path("ab" + "0" * 62, "pdf")
    bad.parent.mkdir(parents=True, exist_ok=True)
    bad.write_bytes(b"adulterado")

    s3 = FakeS3()
    report = migrate_originals(layout, R2BlobStore("b", 1000, s3))
    assert report.uploaded == 2 and len(report.mismatched) == 1
    assert len(s3.objects) == 2
    again = migrate_originals(layout, R2BlobStore("b", 1000, s3))
    assert again.uploaded == 0 and again.already_there == 2
    assert bad.exists()  # nunca apaga

    tight = migrate_originals(layout, R2BlobStore("c", 15, FakeS3()))
    assert tight.stopped_by_quota is not None
