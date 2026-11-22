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


class TooManyEntries(UnsafeArchiveError):
    """Mais entradas do que `max_entries`: o arquivo guarda-se inteiro, sem o abrir."""


class BadArchiveError(ValueError):
    """Não se consegue abrir: o ficheiro está estragado, incompleto ou não é um arquivo."""


class ArchiveToolMissing(RuntimeError):
    pass


TAR_EXTS = {"tar", "tgz", "tar.gz", "tbz2", "tar.bz2", "txz", "tar.xz"}
# Assinaturas dos formatos: o formato vem do conteúdo, não do nome (um ".rar" que na verdade
# é um zip, porque alguém mudou a extensão, abre-se como zip).
_SIGNATURES = (
    (b"PK\x03\x04", "zip"), (b"PK\x05\x06", "zip"), (b"PK\x07\x08", "zip"),
    (b"Rar!\x1a\x07", "rar"), (b"7z\xbc\xaf\x27\x1c", "7z"),
    (b"\x1f\x8b", "tar.gz"), (b"BZh", "tar.bz2"), (b"\xfd7zXZ\x00", "tar.xz"),
)


def archive_format(archive: Path, ext: str) -> str:
    """O formato do arquivo pelo conteúdo; a extensão só quando o conteúdo não diz nada."""
    with archive.open("rb") as handle:
        head = handle.read(512)
    for signature, fmt in _SIGNATURES:
        if head.startswith(signature):
            return fmt
    if head[257:262] == b"ustar":
        return "tar"
    return ext


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
            raise TooManyEntries(
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
    return extension_of(name) in {"zip", "rar", "7z", *TAR_EXTS}


def _format_errors() -> tuple[type[BaseException], ...]:
    """Os erros das bibliotecas quando o ficheiro não é do formato (ou está estragado)."""
    import py7zr.exceptions
    import rarfile

    # `rarfile.Error` inclui o arquivo cifrado ou o volume que falta; a falta do programa
    # (`RarCannotExec`) já foi trocada por `ArchiveToolMissing` antes de chegar aqui.
    return (zipfile.BadZipFile, tarfile.TarError, EOFError, py7zr.exceptions.ArchiveError,
            py7zr.exceptions.PasswordRequired, rarfile.Error)


def _bad(ext: str, fmt: str, exc: BaseException) -> BadArchiveError:
    what = f".{ext}" if fmt == ext else f".{ext} (conteúdo {fmt})"
    return BadArchiveError(
        f"não foi possível abrir o arquivo {what}: pode estar estragado, incompleto ou não ser "
        f"um arquivo ({type(exc).__name__}: {exc})")


def archive_names(archive: Path, ext: str, limit: int) -> list[str]:
    """Os nomes dos ficheiros de um arquivo, sem o extrair (no máximo `limit`)."""
    fmt = archive_format(archive, ext)
    names: list[str] = []
    try:
        if fmt == "zip":
            with zipfile.ZipFile(archive) as zf:
                names = [i.filename for i in zf.infolist() if not i.is_dir()][:limit]
        elif fmt in TAR_EXTS:
            with tarfile.open(archive) as tf:
                for member in tf:
                    if member.isfile():
                        names.append(member.name)
                        if len(names) >= limit:
                            break
        elif fmt == "7z":
            import py7zr

            with py7zr.SevenZipFile(archive) as sz:
                names = [i.filename for i in sz.list() if not i.is_directory][:limit]
        elif fmt == "rar":
            import rarfile

            with rarfile.RarFile(archive) as rf:
                names = [i.filename for i in rf.infolist() if not i.is_dir()][:limit]
    except _format_errors() as exc:
        raise _bad(ext, fmt, exc) from exc
    return names


def unpack(archive: Path, ext: str, dest: Path, settings: ArchiveSettings) -> list[Entry]:
    """Extrai `archive` para `dest` e devolve as entradas (sem lixo de SO), ordenadas. O
    formato vem do conteúdo (`archive_format`); `TooManyEntries` se tiver entradas a mais,
    `BadArchiveError` se não se conseguir abrir."""
    dest.mkdir(parents=True, exist_ok=True)
    budget = _Budget(settings, archive.stat().st_size)
    fmt = archive_format(archive, ext)
    try:
        if fmt == "zip":
            entries = _unpack_zip(archive, dest, budget)
        elif fmt in TAR_EXTS:
            entries = _unpack_tar(archive, dest, budget)
        elif fmt == "7z":
            entries = _unpack_7z(archive, dest, budget)
        elif fmt == "rar":
            entries = _unpack_rar(archive, dest, budget)
        else:
            raise ValueError(f"formato de arquivo não suportado: {ext}")
    except _format_errors() as exc:
        raise _bad(ext, fmt, exc) from exc
    kept = [e for e in entries if not is_junk(PurePosixPath(e.path).name)
            and "__MACOSX" not in PurePosixPath(e.path).parts]
    return sorted(kept, key=lambda e: e.path)
