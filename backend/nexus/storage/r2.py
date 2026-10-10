"""Originais no Cloudflare R2 (API S3), com corte duro de espaço.

Chaves: `blobs/<sha256>` (o conteúdo é imutável). As credenciais vêm só do ambiente:
NEXUS_R2_ENDPOINT, NEXUS_R2_ACCESS_KEY_ID e NEXUS_R2_SECRET_ACCESS_KEY.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from nexus.config import StorageSettings
from nexus.storage.blobstore import BlobStore, GitRepoBlobStore

PREFIX = "blobs/"
GB = 1_000_000_000  # o R2 conta em GB decimais


class QuotaExceeded(RuntimeError):
    """O envio ultrapassaria o limite de espaço definido pelo dono."""


def _s3_client() -> Any:
    import boto3
    from botocore.config import Config

    endpoint = os.environ.get("NEXUS_R2_ENDPOINT")
    key = os.environ.get("NEXUS_R2_ACCESS_KEY_ID")
    secret = os.environ.get("NEXUS_R2_SECRET_ACCESS_KEY")
    if not (endpoint and key and secret):
        raise RuntimeError(
            "Faltam NEXUS_R2_ENDPOINT, NEXUS_R2_ACCESS_KEY_ID ou NEXUS_R2_SECRET_ACCESS_KEY."
        )
    return boto3.client(
        "s3", endpoint_url=endpoint, aws_access_key_id=key, aws_secret_access_key=secret,
        region_name="auto", config=Config(retries={"max_attempts": 8, "mode": "standard"}),
    )


class R2BlobStore:
    def __init__(self, bucket: str, max_bytes: int, client: Any | None = None) -> None:
        self.bucket = bucket
        self.max_bytes = max_bytes
        self._client = client
        self._used: int | None = None

    @property
    def client(self) -> Any:
        """Criado só quando é preciso: uma execução que não toca nos originais (ex.: uma
        correcção feita na interface) não precisa das credenciais do R2."""
        if self._client is None:
            self._client = _s3_client()
        return self._client

    def used_bytes(self) -> int:
        """Espaço ocupado no bucket (lido uma vez e actualizado a cada envio)."""
        if self._used is None:
            total = 0
            token: str | None = None
            while True:
                kwargs: dict[str, Any] = {"Bucket": self.bucket}
                if token:
                    kwargs["ContinuationToken"] = token
                page = self.client.list_objects_v2(**kwargs)
                total += sum(int(o["Size"]) for o in page.get("Contents", []))
                if not page.get("IsTruncated"):
                    break
                token = page["NextContinuationToken"]
            self._used = total
        return self._used

    def exists(self, sha256: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=PREFIX + sha256)
        except Exception as exc:  # ClientError 404 (o tipo depende do botocore)
            status = getattr(exc, "response", {}).get("Error", {}).get("Code")
            if status in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise
        return True

    def put(self, source: Path, sha256: str, ext: str, move: bool) -> None:
        if not self.exists(sha256):
            size = source.stat().st_size
            if self.used_bytes() + size > self.max_bytes:
                raise QuotaExceeded(
                    f"limite do R2 atingido ({self.used_bytes() / GB:.2f} GB de "
                    f"{self.max_bytes / GB:.2f} GB): sobe storage.max_gb para continuar"
                )
            self.client.upload_file(str(source), self.bucket, PREFIX + sha256)
            self._used = self.used_bytes() + size
        if move:
            source.unlink(missing_ok=True)

    def materialize(self, sha256: str, ext: str, dest_dir: Path) -> Path:
        dest_dir.mkdir(parents=True, exist_ok=True)
        target = dest_dir / (f"{sha256}.{ext}" if ext else sha256)
        try:
            self.client.download_file(self.bucket, PREFIX + sha256, str(target))
        except Exception as exc:
            raise FileNotFoundError(f"original {sha256} não encontrado no R2") from exc
        return target


class HybridBlobStore:
    """Lê do git ou do R2 (durante a migração) e grava só no R2."""

    def __init__(self, git: GitRepoBlobStore, remote: R2BlobStore) -> None:
        self.git = git
        self.remote = remote

    def exists(self, sha256: str) -> bool:
        return self.git.exists(sha256) or self.remote.exists(sha256)

    def put(self, source: Path, sha256: str, ext: str, move: bool) -> None:
        if self.git.exists(sha256):
            if move:
                source.unlink(missing_ok=True)
            return
        self.remote.put(source, sha256, ext, move)

    def materialize(self, sha256: str, ext: str, dest_dir: Path) -> Path:
        try:
            return self.git.materialize(sha256, ext, dest_dir)
        except FileNotFoundError:
            return self.remote.materialize(sha256, ext, dest_dir)


def open_blob_store(layout: Any, settings: StorageSettings) -> BlobStore:
    git = GitRepoBlobStore(layout)
    if settings.backend != "r2":
        return git
    if not settings.r2_bucket:
        raise ValueError("storage.r2_bucket em falta na configuração")
    return HybridBlobStore(git, R2BlobStore(settings.r2_bucket, int(settings.max_gb * GB)))


__all__ = ["HybridBlobStore", "QuotaExceeded", "R2BlobStore", "open_blob_store"]
