"""Utilizadores, inscrições, preferências e grupos."""

from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import Field

from nexus.domain.common import Record


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


class User(Record):
    login: str
    name: str | None = None
    created_at: dt.datetime | None = None
    preferences: Preferences = Field(default_factory=Preferences)
    enrollments: Enrollments = Field(default_factory=Enrollments)


class GroupMember(Record):
    login: str
    role: Literal["owner", "member"] = "member"


class Group(Record):
    """Grupo fechado (fase 5). A fronteira real de segurança é o repositório."""

    slug: str
    name: str
    unit: str | None = None
    members: list[GroupMember] = Field(default_factory=list)
