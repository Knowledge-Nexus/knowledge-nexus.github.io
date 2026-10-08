"""Migração dos originais do repositório de dados para o R2.

Só lê: nunca apaga nem altera nada no repositório. Cada ficheiro é confirmado pelo
SHA-256 do conteúdo antes de seguir e pelo tamanho depois de enviado.
"""

from __future__ import annotations

import hashlib
import logging
from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path

from nexus.datarepo.layout import Layout
from nexus.storage.r2 import PREFIX, QuotaExceeded, R2BlobStore

log = logging.getLogger("nexus.migrate")


@dataclass
class MigrationReport:
    uploaded: int = 0
    already_there: int = 0
    bytes_uploaded: int = 0
    mismatched: list[str] = field(default_factory=list)
    stopped_by_quota: str | None = None

    @property
    def ok(self) -> bool:
        return not self.mismatched and self.stopped_by_quota is None


def _originals(layout: Layout) -> Iterator[Path]:
    root = layout.originals_root
    if root.is_dir():
        yield from sorted(p for p in root.glob("*/*") if p.is_file())


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def migrate_originals(layout: Layout, store: R2BlobStore, dry_run: bool = False
                      ) -> MigrationReport:
    report = MigrationReport()
    files = list(_originals(layout))
    for i, path in enumerate(files, 1):
        sha = path.name.split(".", 1)[0]
        if store.exists(sha):
            report.already_there += 1
            continue
        if _sha256(path) != sha:
            log.error("conteúdo não corresponde ao SHA-256 do nome: %s", path)
            report.mismatched.append(sha)
            continue
        size = path.stat().st_size
        if dry_run:
            report.uploaded += 1
            report.bytes_uploaded += size
            continue
        try:
            store.put(path, sha, "", move=False)
        except QuotaExceeded as exc:
            report.stopped_by_quota = str(exc)
            break
        head = store.client.head_object(Bucket=store.bucket, Key=PREFIX + sha)
        if int(head["ContentLength"]) != size:
            report.mismatched.append(sha)
            continue
        report.uploaded += 1
        report.bytes_uploaded += size
        if report.uploaded % 25 == 0:
            log.info("%d/%d originais (%.2f GB no bucket)", i, len(files),
                     store.used_bytes() / 1_000_000_000)
    return report
