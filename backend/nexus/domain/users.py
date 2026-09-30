"""Utilizadores, inscrições, preferências e grupos."""

from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import Field, field_validator

from nexus.domain.common import Record
from nexus.domain.documents import VISIBILITY_RE


class Preferences(Record):
    locale: str = "pt-PT"
    # Modo tutor: dicas progressivas; resolução completa só a pedido explícito.
    tutor_mode: bool = True


class UnitEnrollment(Record):
    unit: str  # chave "<instituicao>/<uc>"
    academic_year: str | None = None


class Enrollments(Record):
    courses: list[str] = Field(default_factory=list)
    units: list[UnitEnrollment] = Field(default_factory=list)

    def unit_keys(self) -> set[str]:
        return {u.unit for u in self.units}


class Sharing(Record):
    """Escolhas de partilha do utilizador para o seu material."""

    # {chave da cadeira: visibilidade}: os documentos sem escolha própria seguem isto.
    units: dict[str, str] = Field(default_factory=dict)
    # {"<cadeira>::<tipo de documento>": visibilidade}: ex. só as fichas de uma cadeira.
    types: dict[str, str] = Field(default_factory=dict)

    @field_validator("units", "types")
    @classmethod
    def _check_units(cls, value: dict[str, str]) -> dict[str, str]:
        for key, visibility in value.items():
            if not VISIBILITY_RE.match(visibility):
                raise ValueError(f"visibilidade inválida para {key}: {visibility}")
        return value


class User(Record):
    login: str
    name: str | None = None
    created_at: dt.datetime | None = None
    preferences: Preferences = Field(default_factory=Preferences)
    enrollments: Enrollments = Field(default_factory=Enrollments)
    sharing: Sharing = Field(default_factory=Sharing)


class GroupMember(Record):
    login: str
    role: Literal["owner", "member"] = "member"


class Group(Record):
    """Grupo fechado (fase 5). A fronteira real de segurança é o repositório."""

    slug: str
    name: str
    unit: str | None = None
    members: list[GroupMember] = Field(default_factory=list)
