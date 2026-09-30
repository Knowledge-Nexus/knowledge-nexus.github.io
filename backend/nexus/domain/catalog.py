"""Estrutura académica: Instituição → Curso → Unidade curricular → Edição."""

from __future__ import annotations

import datetime as dt

from pydantic import Field

from nexus.domain.common import Record


def unit_key(institution: str, unit: str) -> str:
    return f"{institution}/{unit}"


class Topic(Record):
    slug: str
    name: str
    children: list[Topic] = Field(default_factory=list)

    def walk(self) -> list[Topic]:
        out = [self]
        for child in self.children:
            out.extend(child.walk())
        return out


class Assessment(Record):
    """Momento de avaliação de uma edição (as datas servem o calendário da fase 4)."""

    assessment_type: str
    exam_season: str | None = None
    number: int | None = None
    date: dt.date | None = None
    weight: float | None = None
    allows_cheat_sheet: bool | None = None


class UnitEdition(Record):
    academic_year: str
    lecturers: list[str] = Field(default_factory=list)
    assessment_method: str | None = None
    assessments: list[Assessment] = Field(default_factory=list)


class CurricularUnit(Record):
    slug: str
    # Deduzido do caminho do ficheiro; não é gravado.
    institution: str = Field(default="", exclude=True)
    code: str | None = None
    name: str
    acronym: str | None = None
    aliases: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    ects: float | None = None
    lecturers: list[str] = Field(default_factory=list)
    topics: list[Topic] = Field(default_factory=list)
    editions: list[UnitEdition] = Field(default_factory=list)

    @property
    def key(self) -> str:
        return unit_key(self.institution, self.slug)

    def all_lecturers(self) -> list[str]:
        names = list(self.lecturers)
        for edition in self.editions:
            names.extend(n for n in edition.lecturers if n not in names)
        return names


class CourseUnitLink(Record):
    unit: str
    curricular_year: int | None = None
    semester: int | None = None


class Course(Record):
    slug: str
    institution: str = Field(default="", exclude=True)
    name: str
    degree: str | None = None
    units: list[CourseUnitLink] = Field(default_factory=list)

    @property
    def key(self) -> str:
        return unit_key(self.institution, self.slug)


class Institution(Record):
    slug: str
    name: str
    acronym: str | None = None
    aliases: list[str] = Field(default_factory=list)


class Catalog(Record):
    institutions: dict[str, Institution] = Field(default_factory=dict)
    courses: dict[str, Course] = Field(default_factory=dict)
    units: dict[str, CurricularUnit] = Field(default_factory=dict)

    def courses_of_unit(self, key: str) -> list[Course]:
        institution, slug = key.split("/", 1)
        return [
            c
            for c in self.courses.values()
            if c.institution == institution and any(link.unit == slug for link in c.units)
        ]

    def is_empty(self) -> bool:
        return not self.units


# --- Formato de importação/exportação (um único ficheiro) -----------------------------


class InstitutionBundle(Institution):
    courses: list[Course] = Field(default_factory=list)
    units: list[CurricularUnit] = Field(default_factory=list)


class CatalogBundle(Record):
    format: str = "nexus-catalogo"
    version: int = 1
    institutions: list[InstitutionBundle] = Field(default_factory=list)
