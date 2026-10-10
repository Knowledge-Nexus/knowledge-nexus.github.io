"""Catálogo em ficheiros: leitura, importação e exportação do formato `nexus-catalogo`."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from nexus.datarepo.layout import Layout
from nexus.datarepo.yamlio import model_to_data, read_yaml, write_yaml_if_changed
from nexus.domain.catalog import (
    Catalog,
    CatalogBundle,
    Course,
    CourseUnitLink,
    CurricularUnit,
    Institution,
    InstitutionBundle,
    unit_key,
)

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
INSTITUTION_FILE = "instituicao.yaml"
COURSES_DIR = "cursos"
UNITS_DIR = "ucs"


class CatalogError(ValueError):
    pass


def load_catalog(layout: Layout) -> Catalog:
    catalog = Catalog()
    if not layout.catalog_dir.is_dir():
        return catalog
    for inst_dir in sorted(p for p in layout.catalog_dir.iterdir() if p.is_dir()):
        inst_file = inst_dir / INSTITUTION_FILE
        if not inst_file.exists():
            continue
        institution = Institution.model_validate(read_yaml(inst_file))
        catalog.institutions[institution.slug] = institution
        for course_file in sorted((inst_dir / COURSES_DIR).glob("*.yaml")):
            course = Course.model_validate(read_yaml(course_file))
            course.institution = institution.slug
            catalog.courses[course.key] = course
        for unit_file in sorted((inst_dir / UNITS_DIR).glob("*.yaml")):
            unit = CurricularUnit.model_validate(read_yaml(unit_file))
            unit.institution = institution.slug
            catalog.units[unit.key] = unit
    return catalog


def _check_slug(kind: str, slug: str) -> None:
    if not SLUG_RE.match(slug):
        raise CatalogError(f"slug inválido para {kind}: {slug!r} (usa a-z, 0-9 e '-')")


# Listas que um pedido acrescenta em vez de substituir (a interface não as conhece todas:
# "acrescentar o nome alternativo Civil" não pode apagar os que já lá estão).
_ADDITIVE = ("aliases", "keywords")


def _merge(existing: dict[str, Any] | None, incoming: dict[str, Any]) -> dict[str, Any]:
    if existing is None:
        return incoming
    merged = dict(existing)
    merged.update(incoming)
    for key in _ADDITIVE:
        old, new = existing.get(key), incoming.get(key)
        if isinstance(old, list) and isinstance(new, list):
            merged[key] = list(dict.fromkeys([*old, *new]))
    return merged


@dataclass
class ImportReport:
    created: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)

    def record(self, label: str, existed: bool, changed: bool) -> None:
        if not existed:
            self.created.append(label)
        elif changed:
            self.updated.append(label)
        else:
            self.unchanged.append(label)


def _write_entity(path: Path, data: dict[str, Any], label: str, report: ImportReport) -> None:
    existed = path.exists()
    merged = _merge(read_yaml(path) if existed else None, data)
    changed = write_yaml_if_changed(path, merged)
    report.record(label, existed, changed)


def _given(model: Any) -> dict[str, Any]:
    data: dict[str, Any] = model.model_dump(mode="json", exclude_none=True, exclude_unset=True)
    return data


def import_bundle(layout: Layout, raw: Any) -> ImportReport:
    """Importa (funde) um catálogo `nexus-catalogo`. Idempotente."""
    bundle = CatalogBundle.model_validate(raw)
    if bundle.format != "nexus-catalogo":
        raise CatalogError(f"formato desconhecido: {bundle.format}")
    current = load_catalog(layout)
    report = ImportReport()
    # Um curso pode ter cadeiras de outras instituições (pela chave completa `<inst>/<slug>`).
    known_units = set(current.units) | {
        unit_key(inst.slug, u.slug) for inst in bundle.institutions for u in inst.units
    }
    for inst in bundle.institutions:
        _check_slug("instituição", inst.slug)
        courses: list[Course] = []
        for course in inst.courses:
            _check_slug("curso", course.slug)
            course = course.model_copy(update={"institution": inst.slug})
            missing = [link.unit for link in course.units
                       if course.link_key(link) not in known_units]
            if missing:
                raise CatalogError(
                    f"o curso {course.slug} refere cadeiras inexistentes: {', '.join(missing)}"
                )
            # As da mesma instituição gravam-se só com o slug (como sempre).
            if "units" in course.model_fields_set:
                course = course.model_copy(update={"units": [
                    link.model_copy(update={"unit": course.unit_ref(course.link_key(link))})
                    for link in course.units]})
            courses.append(course)
        inst.courses = courses
        inst_dir = layout.catalog_dir / inst.slug
        # Só os campos que o pedido traz: o resto do que está no ficheiro mantém-se
        # (ex.: um pedido que só muda os cursos não apaga os nomes alternativos).
        inst_data = _given(Institution.model_validate(
            inst.model_dump(exclude={"courses", "units"}, exclude_unset=True)
        ))
        _write_entity(inst_dir / INSTITUTION_FILE, inst_data, inst.slug, report)
        for unit in inst.units:
            _check_slug("UC", unit.slug)
            _write_entity(
                inst_dir / UNITS_DIR / f"{unit.slug}.yaml",
                _given(unit),
                unit_key(inst.slug, unit.slug),
                report,
            )
        for course in inst.courses:
            _write_entity(
                inst_dir / COURSES_DIR / f"{course.slug}.yaml",
                _given(course),
                unit_key(inst.slug, course.slug),
                report,
            )
    return report


def export_bundle(layout: Layout) -> dict[str, Any]:
    catalog = load_catalog(layout)
    bundle = CatalogBundle()
    for slug, institution in catalog.institutions.items():
        bundle.institutions.append(
            InstitutionBundle(
                **institution.model_dump(),
                courses=[c for c in catalog.courses.values() if c.institution == slug],
                units=[u for u in catalog.units.values() if u.institution == slug],
            )
        )
    return model_to_data(bundle)


def write_unit(layout: Layout, unit: CurricularUnit) -> bool:
    _check_slug("UC", unit.slug)
    path = layout.catalog_dir / unit.institution / UNITS_DIR / f"{unit.slug}.yaml"
    return write_yaml_if_changed(path, unit)


def remove_unit(layout: Layout, key: str, merge_into: str | None = None) -> bool:
    """Apaga uma cadeira do catálogo (criada por engano ou repetida). Com `merge_into`, os
    nomes dela passam a nomes alternativos da outra e os cursos passam a apontar para a
    outra. Os documentos tratam-se no pipeline. Devolve False se não existir."""
    catalog = load_catalog(layout)
    unit = catalog.units.get(key)
    if unit is None:
        return False
    target = catalog.units.get(merge_into) if merge_into else None
    if merge_into and target is None:
        raise CatalogError(f"cadeira inexistente: {merge_into}")
    if target is not None:
        names = [unit.name, *([unit.acronym] if unit.acronym else []), *unit.aliases]
        known = {n.casefold() for n in (target.name, target.acronym or "", *target.aliases)}
        extra = [n for n in dict.fromkeys(names) if n.casefold() not in known]
        if extra:
            write_unit(layout, target.model_copy(update={"aliases": [*target.aliases, *extra]}))
    for course in catalog.courses.values():
        if key not in course.unit_keys():
            continue
        links: list[CourseUnitLink] = []
        for link in course.units:
            if course.link_key(link) == key:
                if target is None or target.key in course.unit_keys():
                    continue
                link = link.model_copy(update={"unit": course.unit_ref(target.key)})
            links.append(link)
        path = layout.catalog_dir / course.institution / COURSES_DIR / f"{course.slug}.yaml"
        write_yaml_if_changed(path, course.model_copy(update={"units": links}))
    (layout.catalog_dir / unit.institution / UNITS_DIR / f"{unit.slug}.yaml").unlink()
    return True


def remove_course(layout: Layout, key: str) -> bool:
    """Apaga um curso do catálogo. As cadeiras e os documentos ficam: só deixam de estar
    nesse curso. Devolve False se não existir."""
    course = load_catalog(layout).courses.get(key)
    if course is None:
        return False
    (layout.catalog_dir / course.institution / COURSES_DIR / f"{course.slug}.yaml").unlink()
    return True
