"""Cria (ou actualiza) a estrutura de um repositório de dados privado.

Ficheiros *geridos* (workflow, skills, hook, CLAUDE.md) são reescritos com `update=True`.
Ficheiros do utilizador (nexus.yaml, vocabulários, README) só são criados se faltarem.
"""

from __future__ import annotations

import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from nexus import clock
from nexus.config import config_dir
from nexus.datarepo.layout import Layout
from nexus.datarepo.yamlio import write_text_if_changed, write_yaml_if_changed
from nexus.domain.users import User

TEMPLATE_DIR = Path(__file__).parent / "template"
DEFAULT_APP_REPOSITORY = "Knowledge-Nexus/knowledge-nexus.github.io"
LOGIN_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")

# Nomes no template sem ponto inicial (para não serem ignorados pelo empacotamento).
RENAMES = {"gitignore": ".gitignore", "gitattributes": ".gitattributes"}
MANAGED_PREFIXES = (".github/", ".claude/", "CLAUDE.md", ".gitattributes", "deposito/")


@dataclass
class ScaffoldReport:
    created: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    kept: list[str] = field(default_factory=list)


def _render(text: str, owner: str, app_repository: str, app_ref: str) -> str:
    return (text.replace("__OWNER__", owner)
            .replace("__APP_REPOSITORY__", app_repository)
            .replace("__APP_REF__", app_ref))


def scaffold(root: Path, owner: str, app_repository: str = DEFAULT_APP_REPOSITORY,
             app_ref: str = "main", update: bool = False) -> ScaffoldReport:
    if not LOGIN_RE.match(owner):
        raise ValueError(f"login inválido: {owner!r}")
    root.mkdir(parents=True, exist_ok=True)
    report = ScaffoldReport()
    for source in sorted(p for p in TEMPLATE_DIR.rglob("*") if p.is_file()):
        rel = source.relative_to(TEMPLATE_DIR).as_posix()
        rel = RENAMES.get(rel, rel)
        target = root / rel
        managed = rel.startswith(MANAGED_PREFIXES)
        if target.exists() and not (update and managed):
            report.kept.append(rel)
            continue
        existed = target.exists()
        text = _render(source.read_text(encoding="utf-8"), owner, app_repository, app_ref)
        if write_text_if_changed(target, text):
            (report.updated if existed else report.created).append(rel)
        else:
            report.kept.append(rel)
        if rel.endswith(".sh"):
            target.chmod(0o755)
    layout = Layout(root)
    if not layout.vocab_file.exists():
        layout.vocab_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(config_dir() / "vocabularios.yaml", layout.vocab_file)
        report.created.append(layout.relative(layout.vocab_file))
    user_file = layout.user_path(owner)
    if not user_file.exists():
        write_yaml_if_changed(user_file, User(login=owner, created_at=clock.now()))
        report.created.append(layout.relative(user_file))
    (layout.deposit_dir(owner)).mkdir(parents=True, exist_ok=True)
    return report
