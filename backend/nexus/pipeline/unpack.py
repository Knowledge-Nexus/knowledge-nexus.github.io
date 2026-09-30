"""Desempacotamento seguro de arquivos (zip, tar, 7z, rar).

Protege contra path traversal, ligações simbólicas, excesso de entradas e zip bombs
(tamanho total e taxa de compressão). Nunca confia nos tamanhos declarados: conta os
bytes efectivamente escritos.
"""

from __future__ import annotations

import shutil
import tarfile
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

from nexus.config import ArchiveSettings
from nexus.pipeline.filetypes import extension_of, is_junk


class UnsafeArchiveError(ValueError):
    pass


class ArchiveToolMissing(RuntimeError):
    pass


@dataclass(frozen=True)
class Entry:
    path: str  # caminho POSIX relativo dentro do arquivo
    local: Path


def safe_member_path(name: str) -> str | None:
    """Normaliza o nome de uma entrada; None para directórios; erro se for inseguro."""
    cleaned = name.replace("\\", "/")
    if cleaned.endswith("/"):
        return None
    pure = PurePosixPath(cleaned)
    if pure.is_absolute() or (pure.parts and ":" in pure.parts[0]):
        raise UnsafeArchiveError(f"caminho absoluto no arquivo: {name!r}")
    parts = [p for p in pure.parts if p not in ("", ".")]
    if any(p == ".." for p in parts):
        raise UnsafeArchiveError(f"path traversal no arquivo: {name!r}")
    if not parts:
        return None
    return "/".join(parts)


class _Budget:
    def __init__(self, settings: ArchiveSettings, archive_size: int) -> None:
        self.settings = settings
        self.archive_size = max(archive_size, 1)
        self.entries = 0
        self.total = 0

    def add_entry(self) -> None:
        self.entries += 1
        if self.entries > self.settings.max_entries:
            raise UnsafeArchiveError(
                f"o arquivo tem mais de {self.settings.max_entries} entradas"
            )

    def add_bytes(self, count: int) -> None:
        self.total += count
        if self.total > self.settings.max_total_bytes:
            raise UnsafeArchiveError("o conteúdo descomprimido excede o limite permitido")
        ratio = self.total / self.archive_size
        if self.total > 10 * 1024 * 1024 and ratio > self.settings.max_ratio:
            raise UnsafeArchiveError("taxa de compressão suspeita (possível zip bomb)")


def _copy_limited(src, dest: Path, budget: _Budget) -> None:  # type: ignore[no-untyped-def]
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as out:
        while chunk := src.read(1 << 20):
            budget.add_bytes(len(chunk))
            out.write(chunk)


def _zip_name(info: zipfile.ZipInfo) -> str:
    if info.flag_bits & 0x800:
        return info.filename
    # Sem a flag UTF-8, o zipfile descodifica em cp437; os zips do Windows em PT usam cp850
    # ou, cada vez mais, UTF-8 sem a flag.
    raw = info.filename.encode("cp437", errors="replace")
    for encoding in ("utf-8", "cp850"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return info.filename


def _unpack_zip(archive: Path, dest: Path, budget: _Budget) -> list[Entry]:
    entries: list[Entry] = []
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            rel = safe_member_path(_zip_name(info))
            if rel is None or info.is_dir():
                continue
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                continue  # ligação simbólica: ignorada
            budget.add_entry()
            target = dest / rel
            with zf.open(info) as src:
                _copy_limited(src, target, budget)
            entries.append(Entry(rel, target))
    return entries


def _unpack_tar(archive: Path, dest: Path, budget: _Budget) -> list[Entry]:
    entries: list[Entry] = []
    with tarfile.open(archive) as tf:
        for member in tf.getmembers():
            if not member.isfile():
                continue
            rel = safe_member_path(member.name)
            if rel is None:
                continue
            budget.add_entry()
            src = tf.extractfile(member)
            if src is None:
                continue
            target = dest / rel
            with src:
                _copy_limited(src, target, budget)
            entries.append(Entry(rel, target))
    return entries


def _unpack_7z(archive: Path, dest: Path, budget: _Budget) -> list[Entry]:
    import py7zr

    with py7zr.SevenZipFile(archive) as sz:
        infos = [i for i in sz.list() if not i.is_directory]
        names: list[str] = []
        declared = 0
        for info in infos:
            rel = safe_member_path(info.filename)
            if rel is None:
                continue
            budget.add_entry()
            declared += info.uncompressed or 0
            names.append(info.filename)
        budget.add_bytes(declared)
        staging = dest / ".7z-staging"
        sz.extract(path=staging, targets=names)
    return _collect_staged(staging, dest, budget, count_bytes=False)


def _unpack_rar(archive: Path, dest: Path, budget: _Budget) -> list[Entry]:
    import rarfile

    try:
        rf = rarfile.RarFile(archive)
    except rarfile.RarCannotExec as exc:
        raise ArchiveToolMissing(
            "para abrir .rar é preciso unrar, unar, 7z ou bsdtar instalado"
        ) from exc
    entries: list[Entry] = []
    with rf:
        for info in rf.infolist():
            if info.is_dir() or info.is_symlink():
                continue
            rel = safe_member_path(info.filename)
            if rel is None:
                continue
            budget.add_entry()
            target = dest / rel
            try:
                with rf.open(info) as src:
                    _copy_limited(src, target, budget)
            except rarfile.RarCannotExec as exc:
                raise ArchiveToolMissing(
                    "para abrir .rar é preciso unrar, unar, 7z ou bsdtar instalado"
                ) from exc
            entries.append(Entry(rel, target))
    return entries


def _collect_staged(staging: Path, dest: Path, budget: _Budget, count_bytes: bool) -> list[Entry]:
    entries: list[Entry] = []
    for file in sorted(p for p in staging.rglob("*") if p.is_file() and not p.is_symlink()):
        rel = file.relative_to(staging).as_posix()
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if count_bytes:
            budget.add_bytes(file.stat().st_size)
        shutil.move(file, target)
        entries.append(Entry(rel, target))
    shutil.rmtree(staging, ignore_errors=True)
    return entries


def is_archive_name(name: str) -> bool:
    return extension_of(name) in {"zip", "rar", "7z", "tar", "tgz", "tar.gz", "tbz2",
                                  "tar.bz2", "txz", "tar.xz"}


def unpack(archive: Path, ext: str, dest: Path, settings: ArchiveSettings) -> list[Entry]:
    """Extrai `archive` para `dest` e devolve as entradas (sem lixo de SO), ordenadas."""
    dest.mkdir(parents=True, exist_ok=True)
    budget = _Budget(settings, archive.stat().st_size)
    if ext == "zip":
        entries = _unpack_zip(archive, dest, budget)
    elif ext in {"tar", "tgz", "tar.gz", "tbz2", "tar.bz2", "txz", "tar.xz"}:
        entries = _unpack_tar(archive, dest, budget)
    elif ext == "7z":
        entries = _unpack_7z(archive, dest, budget)
    elif ext == "rar":
        entries = _unpack_rar(archive, dest, budget)
    else:
        raise ValueError(f"formato de arquivo não suportado: {ext}")
    kept = [e for e in entries if not is_junk(PurePosixPath(e.path).name)
            and "__MACOSX" not in PurePosixPath(e.path).parts]
    return sorted(kept, key=lambda e: e.path)
