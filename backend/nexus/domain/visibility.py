"""Visibilidade efectiva de um documento.

O dono escolhe por cadeira (`utilizadores/<login>.yaml`, `sharing.units`) e pode abrir
excepções por documento (`documentos/<id>.yaml`, `visibility`). Sem escolha, é privado.
Só `public` sai do repositório de dados privado (ver nexus.public); o pipeline nunca
escolhe visibilidades — só o utilizador.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import NamedTuple

from nexus.domain.documents import Document
from nexus.domain.users import User

PRIVATE = "private"
PUBLIC = "public"


class Visibility(NamedTuple):
    value: str
    inherited: bool  # True = vem da cadeira (ou da predefinição), não do documento


def effective_visibility(doc: Document, users: Mapping[str, User]) -> Visibility:
    if doc.visibility is not None:
        return Visibility(doc.visibility, False)
    unit = doc.classification.value("unit")
    owner = users.get(doc.owner)
    if unit and owner is not None:
        chosen = owner.sharing.units.get(str(unit))
        if chosen is not None:
            return Visibility(chosen, True)
    return Visibility(PRIVATE, True)


def is_public(doc: Document, users: Mapping[str, User]) -> bool:
    return effective_visibility(doc, users).value == PUBLIC
