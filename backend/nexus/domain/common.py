"""Base comum dos registos guardados em YAML."""

from __future__ import annotations

import os
import time
import uuid

from pydantic import BaseModel, ConfigDict


class Record(BaseModel):
    """Registo persistido. `extra="allow"` preserva campos de versões mais recentes."""

    model_config = ConfigDict(
        extra="allow",
        populate_by_name=True,
        coerce_numbers_to_str=True,
        validate_assignment=True,
    )


def uuid7() -> str:
    """UUID versão 7 (ordenável pelo tempo), RFC 9562."""
    ms = time.time_ns() // 1_000_000
    rand = int.from_bytes(os.urandom(10), "big")
    value = (ms & ((1 << 48) - 1)) << 80
    value |= 0x7 << 76
    value |= ((rand >> 62) & 0xFFF) << 64
    value |= 0b10 << 62
    value |= rand & ((1 << 62) - 1)
    return str(uuid.UUID(int=value))
