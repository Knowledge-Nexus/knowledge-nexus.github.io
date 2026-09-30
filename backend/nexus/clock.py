"""Relógio injectável, para os testes poderem fixar o tempo."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime

_fixed: datetime | None = None


def now() -> datetime:
    """Instante actual em UTC, truncado ao segundo (estável em YAML)."""
    if _fixed is not None:
        return _fixed
    return datetime.now(UTC).replace(microsecond=0)


@contextmanager
def fixed(at: datetime) -> Iterator[None]:
    global _fixed
    previous = _fixed
    _fixed = at
    try:
        yield
    finally:
        _fixed = previous
