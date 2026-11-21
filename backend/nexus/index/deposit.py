"""O que ficou por tratar no depósito: o que ainda espera (e porquê) e o que falhou.

Vai no `manifest.json` dos índices privados (`deposit`, nunca nos públicos). A interface usa-o
para dizer se o processamento ainda tem trabalho (canto inferior esquerdo) e para mostrar ao
dono, nas notificações, os ficheiros que não foi possível guardar, pelo nome.

- `waiting`: itens que continuam no depósito depois de processar. Com `kind`, estão parados
  por uma razão conhecida (`storage`: sem onde guardar o original; `tool`: falta uma
  ferramenta; `parts`: envio ainda incompleto; `error`: lote que não abre); sem `kind`, ainda
  vão ser tratados (um depósito grande trata-se aos bocados).
- `failed`: itens que foram para `deposito/<login>/_erros/` (cada um com o seu `.log`).
- `catalog_failed`: pedidos da interface (`catalogo/_importar/`) que não se aplicaram.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from pathlib import Path, PurePosixPath
from typing import Any

from nexus.datarepo.layout import ERRORS_DIR, LOG_SUFFIX
from nexus.datarepo.store import DataRepo
from nexus.pipeline.intake import scan_deposit

# Um depósito de milhares de ficheiros não pode encher o manifest: listam-se os primeiros e
# conta-se o resto.
MAX_LISTED = 100
MAX_ERROR_CHARS = 300


# O caminho absoluto no computador que processou (ex.: "/home/x/dados/deposito/a.pdf") não
# interessa a quem lê: fica a partir de `deposito/`.
_LOCAL_PREFIX = re.compile(r"(?:[A-Za-z]:)?[/\\][^\s'\"]*?[/\\](?=deposito[/\\])")


def _short(text: str) -> str:
    line = text.strip().splitlines()[0] if text.strip() else ""
    line = _LOCAL_PREFIX.sub("", line)
    return line if len(line) <= MAX_ERROR_CHARS else line[: MAX_ERROR_CHARS - 1] + "…"


def _log_fields(path: Path) -> dict[str, str]:
    fields: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        key, sep, value = line.partition(": ")
        if not sep or key not in ("data", "item", "erro"):
            if not line.strip():
                break  # depois da linha vazia vem o traceback
            continue
        fields.setdefault(key, value)
    return fields


def _failed(repo: DataRepo) -> list[dict[str, Any]]:
    root = repo.layout.deposit_root
    if not root.is_dir():
        return []
    out: list[dict[str, Any]] = []
    for log_file in sorted(root.glob(f"*/{ERRORS_DIR}/**/*{LOG_SUFFIX}")):
        fields = _log_fields(log_file)
        login = log_file.relative_to(root).parts[0]
        label = fields.get("item") or log_file.name.removesuffix(LOG_SUFFIX)
        out.append({
            "label": label,
            "login": login,
            "name": PurePosixPath(label).name or label,
            "error": _short(fields.get("erro", "")),
            "at": fields.get("data") or None,
            "log": log_file.relative_to(repo.root).as_posix(),
        })
    return out


def _catalog_failed(repo: DataRepo) -> list[dict[str, Any]]:
    errors = repo.layout.requests_dir / ERRORS_DIR
    if not errors.is_dir():
        return []
    return [{
        "name": log_file.name.removesuffix(LOG_SUFFIX),
        "error": _short(log_file.read_text(encoding="utf-8", errors="replace")),
        "log": log_file.relative_to(repo.root).as_posix(),
    } for log_file in sorted(errors.glob(f"*{LOG_SUFFIX}"))]


def deposit_status(repo: DataRepo,
                   deferred: Mapping[str, tuple[str, str]] | None = None) -> dict[str, Any]:
    """O estado do depósito para o manifest. `deferred` vem do relatório da execução
    (`RunReport.deferred`); sem ele (índices construídos sem processar), os itens que estão
    no depósito aparecem sem razão."""
    scan = scan_deposit(repo.layout.deposit_root, set(repo.users), repo.default_owner,
                        repo.settings.code_projects)
    known = deferred or {}
    waiting: list[dict[str, Any]] = []
    for item in scan.items:
        entry: dict[str, Any] = {
            "label": item.label,
            "login": item.login,
            "name": PurePosixPath(item.rel).name or item.label,
        }
        if item.label in known:
            kind, reason = known[item.label]
            entry |= {"kind": kind, "reason": _short(reason)}
        waiting.append(entry)
    # Os parados primeiro: são os que o dono tem de ver.
    waiting.sort(key=lambda e: ("kind" not in e, e["label"]))
    failed = _failed(repo)
    catalog = _catalog_failed(repo)
    return {
        "waiting": waiting[:MAX_LISTED],
        "waiting_total": len(waiting),
        "stuck_total": sum(1 for e in waiting if "kind" in e),
        "failed": failed[:MAX_LISTED],
        "failed_total": len(failed),
        "catalog_failed": catalog[:MAX_LISTED],
    }
