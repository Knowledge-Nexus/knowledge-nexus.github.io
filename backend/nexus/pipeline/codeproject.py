"""Projectos de código: detecção e empacotamento como unidade (zip determinístico)."""

from __future__ import annotations

import fnmatch
import zipfile
from pathlib import Path, PurePosixPath

from nexus.config import CodeProjectSettings
from nexus.domain.documents import Manifest, ManifestFile, ManifestIgnored
from nexus.pipeline.filetypes import Category, category_of, extension_of
from nexus.pipeline.hashing import sha256_file

_FIXED_DATE = (1980, 1, 1, 0, 0, 0)


def _dirs_of(path: str) -> list[str]:
    parts = PurePosixPath(path).parts[:-1]
    return ["/".join(parts[: i + 1]) for i in range(len(parts))]


def _is_ignored(path: str, settings: CodeProjectSettings) -> bool:
    return any(part in settings.ignored_dirs for part in PurePosixPath(path).parts[:-1])


def _has_marker(directory: str, files: list[str], settings: CodeProjectSettings) -> bool:
    prefix = f"{directory}/" if directory else ""
    for path in files:
        if not path.startswith(prefix):
            continue
        rest = path[len(prefix) :]
        first = rest.split("/", 1)[0]
        if "/" in rest and first in settings.markers:
            return True  # directório marcador, ex.: .git/
        if "/" not in rest and any(fnmatch.fnmatch(rest, m) for m in settings.markers):
            return True
    return False


def _code_ratio(
    directory: str, files: list[str], settings: CodeProjectSettings
) -> tuple[int, float]:
    prefix = f"{directory}/"
    inside = [f for f in files if f.startswith(prefix) and not _is_ignored(f, settings)]
    if not inside:
        return 0, 0.0
    exts = set(settings.code_extensions)
    code = [f for f in inside if extension_of(f) in exts]
    return len(code), len(code) / len(inside)


_DOCUMENT_CATEGORIES = {Category.PDF, Category.DOCX, Category.PPTX, Category.XLSX,
                        Category.LEGACY_OFFICE}


def _has_documents(directory: str, files: list[str], settings: CodeProjectSettings) -> bool:
    """Tem documentos de estudo (PDF, Word, PowerPoint, Excel…) algures lá dentro?

    Sem marcador, uma pasta assim é de arrumação (ex.: `<instituição>/<cadeira>/`, ou um
    trabalho com o relatório): os documentos ficam como documentos próprios, pesquisáveis
    e classificados, e só as subpastas só com código viram projectos."""
    prefix = f"{directory}/" if directory else ""
    code = set(settings.code_extensions)
    return any(category_of(extension_of(f), code) in _DOCUMENT_CATEGORIES
               for f in files if f.startswith(prefix) and not _is_ignored(f, settings))


def find_projects(files: list[str], settings: CodeProjectSettings) -> list[str]:
    """Raízes de projectos de código (caminhos relativos; "" = a raiz toda).

    Um directório é projecto se tiver um marcador (pyproject.toml, package.json, .git…)
    ou, não sendo a raiz, se tiver código suficiente e nenhum documento de estudo (essa é
    uma pasta de arrumação, que junta coisas diferentes). Fica o mais exterior.
    """
    candidates: set[str] = set()
    directories = sorted({d for f in files for d in _dirs_of(f)})
    if _has_marker("", files, settings):
        return [""]
    for directory in directories:
        if any(part in settings.ignored_dirs for part in PurePosixPath(directory).parts):
            continue
        if _has_marker(directory, files, settings):
            candidates.add(directory)
            continue
        count, ratio = _code_ratio(directory, files, settings)
        if (count >= settings.min_code_files and ratio >= settings.code_ratio
                and not _has_documents(directory, files, settings)):
            candidates.add(directory)
    outermost = [
        c for c in candidates if not any(c != o and c.startswith(o + "/") for o in candidates)
    ]
    return sorted(outermost)


def files_in(project: str, files: list[str]) -> list[str]:
    if project == "":
        return list(files)
    prefix = f"{project}/"
    return [f for f in files if f.startswith(prefix)]


def build_bundle(
    root: Path, project: str, files: list[str], dest: Path, settings: CodeProjectSettings
) -> Manifest:
    """Empacota os ficheiros do projecto num zip determinístico e devolve o manifesto.

    O zip inclui TODOS os ficheiros (são originais do utilizador); o manifesto lista os
    que interessam para indexação e resume os directórios ignorados (node_modules, …).
    """
    members = sorted(files_in(project, files))
    prefix = f"{project}/" if project else ""
    manifest = Manifest(root=project or ".")
    ignored: dict[str, ManifestIgnored] = {}
    dest.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for rel in members:
            inner = rel[len(prefix) :]
            source = root / rel
            info = zipfile.ZipInfo(inner, date_time=_FIXED_DATE)
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, source.read_bytes())
            size = source.stat().st_size
            if _is_ignored(inner, settings):
                top = next(p for p in PurePosixPath(inner).parts if p in settings.ignored_dirs)
                key = inner.split(top, 1)[0] + top
                entry = ignored.setdefault(key, ManifestIgnored(path=key, files=0, bytes=0))
                entry.files += 1
                entry.bytes += size
            else:
                manifest.files.append(
                    ManifestFile(path=inner, size=size, sha256=sha256_file(source))
                )
    manifest.ignored = [ignored[k] for k in sorted(ignored)]
    return manifest
