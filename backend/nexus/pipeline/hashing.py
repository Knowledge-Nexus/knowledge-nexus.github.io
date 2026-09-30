"""SHA-256 dos ficheiros (identidade do conteúdo) e simhash do texto (quase-duplicados)."""

from __future__ import annotations

import hashlib
from pathlib import Path

from nexus.domain.text import normalize

_CHUNK = 1 << 20


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        while chunk := fh.read(_CHUNK):
            digest.update(chunk)
    return digest.hexdigest()


def simhash(text: str, shingle: int = 3) -> tuple[str, int]:
    """Simhash de 64 bits sobre shingles de palavras. Devolve (hex, número de palavras)."""
    words = normalize(text).split()
    if not words:
        return "0" * 16, 0
    grams = [" ".join(words[i : i + shingle]) for i in range(max(1, len(words) - shingle + 1))]
    votes = [0] * 64
    for gram in grams:
        value = int.from_bytes(hashlib.blake2b(gram.encode(), digest_size=8).digest(), "big")
        for bit in range(64):
            votes[bit] += 1 if value >> bit & 1 else -1
    result = 0
    for bit, vote in enumerate(votes):
        if vote > 0:
            result |= 1 << bit
    return f"{result:016x}", len(words)


def hamming(a: str, b: str) -> int:
    return (int(a, 16) ^ int(b, 16)).bit_count()
