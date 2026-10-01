"""Conjuntos: ficheiros que só fazem sentido juntos (enunciado + código + imagens).

Dois caminhos:
- **Pastas de projecto** (heurística): os ficheiros da mesma pasta, quando há código e
  também um enunciado ou imagens, formam um conjunto. Um arquivo perto da raiz conta como
  a pasta onde está (`Projeto/Código.zip!/Código/jogo.py` é da pasta `Projeto`).
- **Juntados por ti** (`method: user`), na interface. O motor nunca os desfaz.

Em cada conjunto há um documento principal (o enunciado, de preferência). Os outros herdam
dele a classificação (só os campos que não são teus) e ficam arrumados com ele, numa
subpasta com o nome dele. Nada disto apaga nem altera originais.
"""

from __future__ import annotations

import hashlib
from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass

from nexus.domain.documents import (
    METHOD_HEURISTIC,
    BundleRef,
    Document,
    DocumentKind,
    FieldValue,
    Reason,
)
from nexus.pipeline.filetypes import Category, category_of

INHERITED_FIELDS = ("unit", "document_type", "academic_year", "assessment_type",
                    "exam_season", "assessment_number", "date", "role", "solution_origin")
INHERITED = "bundle.inherited"
MAX_MEMBERS = 20
MAX_DOCUMENTS = 3

_DOCUMENTS = {Category.PDF, Category.DOCX, Category.PPTX, Category.XLSX,
              Category.LEGACY_OFFICE}
_CODE = {Category.CODE, Category.NOTEBOOK}
# Preferência para documento principal: o enunciado primeiro, as imagens no fim.
_LEAD_ORDER = [Category.PDF, Category.DOCX, Category.LEGACY_OFFICE, Category.PPTX,
               Category.XLSX, Category.NOTEBOOK, Category.TEXT, Category.CODE,
               Category.OTHER, Category.IMAGE, Category.ARCHIVE]


def folder_of(path: str) -> str | None:
    """Pasta de um ficheiro no depósito; perto da raiz de um arquivo, a pasta do arquivo."""
    parts = path.split("!/")
    inner = parts[-1]
    if len(parts) > 1 and inner.count("/") <= 1:
        container = "!/".join(parts[:-1])
        last = container.split("!/")[-1]
        return container.rsplit("/", 1)[0] if "/" in last else None
    return path.rsplit("/", 1)[0] if "/" in inner else None


def folder_name(folder: str) -> str:
    name = folder.replace("!/", "/").rstrip("/").rsplit("/", 1)[-1]
    for ext in (".zip", ".rar", ".7z", ".tar.gz", ".tgz", ".tar"):
        if name.lower().endswith(ext):
            return name[: -len(ext)]
    return name


def bundle_id(owner: str, folder: str) -> str:
    return "pasta-" + hashlib.sha256(f"{owner}\0{folder}".encode()).hexdigest()[:12]


@dataclass(frozen=True)
class FolderGroup:
    folder: str
    members: tuple[str, ...]


def _qualifies(categories: list[Category]) -> bool:
    documents = sum(c in _DOCUMENTS for c in categories)
    return (2 <= len(categories) <= MAX_MEMBERS and any(c in _CODE for c in categories)
            and any(c in _DOCUMENTS or c is Category.IMAGE for c in categories)
            and documents <= MAX_DOCUMENTS)


def project_folders(docs: Iterable[Document], code_extensions: set[str]) -> dict[str, BundleRef]:
    """Conjuntos propostos pelas pastas: {id do documento: conjunto}. Determinístico."""
    candidates: dict[tuple[str, str], set[str]] = defaultdict(set)
    category: dict[str, Category] = {}
    for doc in docs:
        if doc.kind is not DocumentKind.FILE or doc.duplicate_of or doc.bundle_dismissed:
            continue
        if doc.bundle is not None and doc.bundle.method != METHOD_HEURISTIC:
            continue
        category[doc.id] = category_of(doc.blob.ext, code_extensions)
        for source in doc.sources:
            folder = folder_of(source.path)
            if folder:
                candidates[(doc.owner, folder)].add(doc.id)
    # As pastas maiores primeiro; um documento só entra num conjunto.
    order = sorted(candidates.items(), key=lambda kv: (-len(kv[1]), kv[0]))
    taken: set[str] = set()
    out: dict[str, BundleRef] = {}
    for (owner, folder), ids in order:
        members = sorted(ids - taken)
        if not _qualifies([category[i] for i in members]):
            continue
        ref = BundleRef(id=bundle_id(owner, folder), name=folder_name(folder),
                        method=METHOD_HEURISTIC)
        for doc_id in members:
            out[doc_id] = ref
        taken.update(members)
    return out


def choose_lead(members: list[Document], code_extensions: set[str]) -> Document:
    """O documento principal: arrumado, de preferência um enunciado (PDF, Word…), com a
    cadeira mais certa; empate pelo id."""
    def key(doc: Document) -> tuple[int, int, float, str]:
        unit = doc.classification.unit
        return (
            0 if doc.filed_name and not doc.needs_review else 1,
            _LEAD_ORDER.index(category_of(doc.blob.ext, code_extensions))
            if doc.kind is DocumentKind.FILE else len(_LEAD_ORDER),
            -(unit.confidence if unit and unit.value is not None else 0.0),
            doc.id,
        )
    return min(members, key=key)


def inherit(member: Document, lead: Document) -> None:
    """Copia a classificação do principal para os campos do membro que não são teus."""
    for name in INHERITED_FIELDS:
        mine: FieldValue | None = getattr(member.classification, name)
        if mine is not None and mine.method != METHOD_HEURISTIC:
            continue
        theirs: FieldValue | None = getattr(lead.classification, name)
        if theirs is None or theirs.value is None:
            if mine is not None and any(r.code == INHERITED for r in mine.reasons):
                setattr(member.classification, name, None)
            continue
        setattr(member.classification, name, FieldValue(
            value=theirs.value,
            confidence=1.0 if theirs.is_user else theirs.confidence,
            method=METHOD_HEURISTIC,
            reasons=[Reason(code=INHERITED, params={"name": member.bundle.name
                                                    if member.bundle else ""})],
        ))


def member_name(lead_filed_name: str, member: Document) -> str:
    """`<nome do principal sem extensão>/<nome original do membro>`."""
    folder = lead_filed_name.rsplit(".", 1)[0]
    original = (member.sources[0].path.split("!/")[-1].rsplit("/", 1)[-1]
                if member.sources else member.blob.sha256[:12])
    return f"{folder}/{original.replace('/', '-')}"
