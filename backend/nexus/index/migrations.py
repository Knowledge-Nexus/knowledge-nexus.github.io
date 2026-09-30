"""Configuração Alembic para o futuro servidor (fase 5).

Na fase 1 a base é derivada e reconstruída do zero; estas migrações existem para que o
servidor (PostgreSQL) parta de um esquema versionado igual ao que o browser já lê.
"""

from __future__ import annotations

from pathlib import Path

from alembic.config import Config

SCRIPT_LOCATION = Path(__file__).parent / "alembic"


def alembic_config(url: str) -> Config:
    config = Config()
    config.set_main_option("script_location", str(SCRIPT_LOCATION))
    config.set_main_option("sqlalchemy.url", url)
    return config
