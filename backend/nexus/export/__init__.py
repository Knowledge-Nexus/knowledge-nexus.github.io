"""Exporta a organização da biblioteca como árvore física de pastas:
`<curso>/<uc>/<tipo>/<ano-lectivo>_<descricao>.<ext>`.

Por defeito copia (os originais nunca podem ser alterados através da exportação);
`mode="link"` cria ligações simbólicas para os originais (só leitura).
"""

from __future__ import annotations

import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from nexus.datarepo.store import DataRepo
from nexus.domain.documents import DocumentKind, Status
from nexus.storage.blobstore import GitRepoBlobStore

NO_COURSE = "_sem-curso"
NO_UNIT = "_sem-uc"


@dataclass
class ExportReport:
    written: list[Path] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)


def export_tree(repo: DataRepo, dest: Path, owner: str | None = None,
                mode: Literal["copy", "link"] = "copy") -> ExportReport:
    catalog = repo.catalog
    blobs = GitRepoBlobStore(repo.layout)
    report = ExportReport()
    used: set[Path] = set()
    staging = dest / ".nexus-tmp"
    for doc in sorted(repo.documents.values(), key=lambda d: (d.filed_name or "", d.id)):
        if owner and doc.owner != owner:
            continue
        if doc.kind is DocumentKind.ARCHIVE or not doc.reached(Status.FILED) or not doc.filed_name:
            report.skipped.append(doc.id)
            continue
        unit_key = doc.classification.value("unit")
        unit = catalog.units.get(unit_key) if unit_key else None
        courses = sorted(catalog.courses_of_unit(unit_key), key=lambda c: c.slug) \
            if unit_key else []
        folder = (dest / (courses[0].slug if courses else NO_COURSE)
                  / (unit.slug if unit else NO_UNIT)
                  / (doc.classification.value("document_type") or "outros"))
        target = folder / doc.filed_name
        stem, dot, ext = doc.filed_name.rpartition(".")
        counter = 2
        while target in used or target.exists():
            target = folder / (f"{stem}-{counter}.{ext}" if dot else f"{doc.filed_name}-{counter}")
            counter += 1
        used.add(target)
        source = blobs.materialize(doc.blob.sha256, doc.blob.ext, staging)
        folder.mkdir(parents=True, exist_ok=True)
        if mode == "link":
            os.symlink(source.resolve(), target)
        else:
            shutil.copyfile(source, target)
        report.written.append(target)
    shutil.rmtree(staging, ignore_errors=True)
    return report
