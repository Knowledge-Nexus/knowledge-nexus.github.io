"""Recepção: percorre `deposito/` e agrupa o que lá está em itens a processar.

Estrutura esperada: `deposito/<login>/<lote>/<caminho relativo original>`.
Também aceita ficheiros soltos em `deposito/<login>/` e, para quem envia pela interface
web do GitHub, em `deposito/` (dono = `owner` do nexus.yaml).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from nexus.config import CodeProjectSettings
from nexus.datarepo.layout import ERRORS_DIR, PART_MARK, PARTS_SUFFIX, REF_SUFFIX
from nexus.pipeline import codeproject
from nexus.pipeline.filetypes import is_junk


@dataclass
class DepositItem:
    login: str
    batch: str | None
    rel: str  # caminho relativo ao lote (o caminho original do utilizador)
    base: Path  # pasta do lote (ou do utilizador, se não houver lote)
    kind: str = "file"  # file | code_project | ref | parts
    # code_project: ficheiros do projecto; parts: manifesto + partes (relativos a base)
    files: list[str] = field(default_factory=list)

    @property
    def path(self) -> Path:
        return self.base / self.rel if self.rel else self.base

    def deposit_paths(self) -> list[Path]:
        if self.kind in ("code_project", "parts"):
            return [self.base / f for f in self.files]
        return [self.path]

    @property
    def label(self) -> str:
        prefix = f"{self.login}/{self.batch}/" if self.batch else f"{self.login}/"
        return prefix + (self.rel or ".")


_PART_RE = re.compile(re.escape(PART_MARK) + r"\d{4}$")


@dataclass
class Scan:
    items: list[DepositItem]
    junk: list[Path]


def _files_under(folder: Path) -> list[str]:
    return sorted(
        p.relative_to(folder).as_posix()
        for p in folder.rglob("*")
        if p.is_file() and not p.is_symlink()
    )


def _batch_items(login: str, batch: str | None, base: Path, files: list[str],
                 settings: CodeProjectSettings, junk: list[Path]) -> list[DepositItem]:
    kept: list[str] = []
    for rel in files:
        name = rel.rsplit("/", 1)[-1]
        if is_junk(name):
            junk.append(base / rel)
        else:
            kept.append(rel)
    items: list[DepositItem] = []
    # Ficheiros em partes: um item por manifesto; as partes nunca são itens soltos.
    part_files = [r for r in kept if _PART_RE.search(r)]
    for manifest in [r for r in kept if r.endswith(PARTS_SUFFIX)]:
        target = manifest.removesuffix(PARTS_SUFFIX)
        parts = sorted(r for r in part_files if r.startswith(target + PART_MARK))
        items.append(DepositItem(login, batch, target, base, "parts", [manifest, *parts]))
    kept = [r for r in kept if not r.endswith(PARTS_SUFFIX) and not _PART_RE.search(r)]
    projects = codeproject.find_projects(kept, settings)
    in_project: set[str] = set()
    for project in projects:
        members = codeproject.files_in(project, kept)
        in_project.update(members)
        items.append(DepositItem(login, batch, project, base, "code_project", members))
    for rel in kept:
        if rel in in_project:
            continue
        kind = "ref" if rel.endswith(REF_SUFFIX) else "file"
        items.append(DepositItem(login, batch, rel, base, kind))
    return items


def scan_deposit(deposit_root: Path, known_logins: set[str], default_owner: str,
                 settings: CodeProjectSettings) -> Scan:
    items: list[DepositItem] = []
    junk: list[Path] = []
    if not deposit_root.is_dir():
        return Scan(items, junk)
    loose: list[str] = []
    for child in sorted(deposit_root.iterdir()):
        if child.name.startswith((".", "_")):
            continue
        if child.is_file():
            loose.append(child.name)
            continue
        if child.name in known_logins or child.name == default_owner:
            login = child.name
            direct: list[str] = []
            for sub in sorted(child.iterdir()):
                if sub.name == ERRORS_DIR or sub.name.startswith("."):
                    continue
                if sub.is_file():
                    direct.append(sub.name)
                elif sub.is_dir():
                    items += _batch_items(login, sub.name, sub, _files_under(sub), settings, junk)
            items += _batch_items(login, None, child, direct, settings, junk)
        else:
            # Pasta sem dono conhecido: é um lote do dono por defeito.
            items += _batch_items(default_owner, child.name, child, _files_under(child),
                                  settings, junk)
    items += _batch_items(default_owner, None, deposit_root, loose, settings, junk)
    return Scan(items, junk)
