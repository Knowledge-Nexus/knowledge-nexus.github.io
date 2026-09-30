"""Escolhas de visibilidade do utilizador (por cadeira e por documento)."""

from __future__ import annotations

from nexus.datarepo.store import DataRepo
from nexus.datarepo.yamlio import write_yaml_if_changed
from nexus.domain.documents import VISIBILITY_RE, Document
from nexus.domain.users import User


class SharingError(ValueError):
    pass


# Nomes em português aceites pela CLI.
ALIASES = {"publico": "public", "público": "public", "privado": "private"}


def parse_visibility(value: str | None) -> str | None:
    """`None`/"cadeira" = seguir a cadeira; aceita também os nomes em português."""
    if value is None or value in ("cadeira", "herdar", "inherit"):
        return None
    value = ALIASES.get(value, value)
    if not VISIBILITY_RE.match(value):
        raise SharingError(f"visibilidade inválida: {value}")
    return value


def set_document_visibility(repo: DataRepo, doc_id: str, value: str | None) -> Document:
    doc = repo.documents.get(doc_id)
    if doc is None:
        raise SharingError(f"documento inexistente: {doc_id}")
    doc = doc.model_copy(update={"visibility": parse_visibility(value)})
    repo.save_document(doc)
    return doc


def set_unit_visibility(repo: DataRepo, login: str, unit: str, value: str | None) -> User:
    if unit not in repo.catalog.units:
        raise SharingError(f"cadeira inexistente no catálogo: {unit}")
    user = repo.users.get(login) or User(login=login)
    units = dict(user.sharing.units)
    parsed = parse_visibility(value)
    if parsed is None:
        units.pop(unit, None)
    else:
        units[unit] = parsed
    user = user.model_copy(update={"sharing": user.sharing.model_copy(update={"units": units})})
    write_yaml_if_changed(repo.layout.user_path(login), user)
    return user
