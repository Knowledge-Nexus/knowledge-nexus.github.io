"""Organização da origem: `<instituição>/<ano lectivo>/<Nº Semestre>/<cadeira>/…`.

Quando o material chega já arrumado assim, a pasta do ano dá o ano lectivo, a do semestre
o semestre e a seguinte o nome da cadeira. O que está mais fundo (subpastas ou arquivos)
fica junto num conjunto, excepto as pastas de tipo de material ("Material Prático",
"Teóricas"…), que só ajudam a decidir o tipo. Nada aqui depende de nomes fixos: as pastas
de material reconhecem-se pelos tipos de documento do vocabulário.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass

_YEAR_RE = re.compile(r"^\s*((?:19|20)\d{2})\s*[_\-./ ]\s*((?:19|20)?\d{2})\s*$")
_SEMESTER_RE = re.compile(r"^\s*([1-4])\s*\.?\s*[ºo°ª]?\s*semestre\s*$", re.IGNORECASE)


@dataclass(frozen=True)
class Layout:
    academic_year: str  # "2020-2021"
    semester: int | None
    unit: str  # nome da pasta da cadeira
    unit_folder: str  # caminho até à pasta da cadeira (inclusive)
    rest: tuple[str, ...]  # componentes depois da pasta da cadeira (o último é o ficheiro)


def full_path(batch: str | None, path: str) -> str:
    return f"{batch}/{path}" if batch else path


def parse(path: str) -> Layout | None:
    """Reconhece `…/<AAAA_AAAA>/[<Nº Semestre>/]<cadeira>/<…>/<ficheiro>`."""
    parts = [p for p in path.replace("!/", "/").split("/") if p]
    for i, part in enumerate(parts[:-2]):
        match = _YEAR_RE.match(part)
        if not match:
            continue
        first = int(match.group(1))
        raw = match.group(2)
        second = int(raw) if len(raw) == 4 else (first // 100) * 100 + int(raw)
        if second != first + 1:
            continue
        j = i + 1
        semester = _SEMESTER_RE.match(parts[j])
        if semester:
            j += 1
        if j >= len(parts) - 1:
            return None
        return Layout(f"{first}-{second}", int(semester.group(1)) if semester else None,
                      parts[j].strip(), "/".join(parts[: j + 1]), tuple(parts[j + 1:]))
    return None


def group_folder(layout: Layout, is_material: Callable[[str], bool]) -> str | None:
    """Pasta que agrupa o ficheiro: a primeira subpasta (ou arquivo) depois da cadeira e
    das pastas de material; None se o ficheiro estiver solto nessas pastas."""
    rest = list(layout.rest[:-1])
    prefix = [layout.unit_folder]
    while rest and is_material(rest[0]):
        prefix.append(rest.pop(0))
    if not rest:
        return None
    return "/".join([*prefix, rest[0]])
