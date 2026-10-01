"""Lotes: depósitos grandes enviados pela interface como um só zip (`*.nexus-lote.zip`).

A API do GitHub limita os pedidos que criam conteúdo (cerca de 80 por minuto e 500 por
hora), por isso a interface junta centenas de ficheiros num zip, dividido em partes se
for grande. Antes de tudo o resto, o motor abre cada lote na pasta onde está, como se os
ficheiros tivessem sido depositados um a um (mesmos caminhos, sem documento "arquivo"),
e apaga o lote. Um lote em partes ainda incompleto fica para a próxima execução.
"""

from __future__ import annotations

import shutil
import zipfile
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

from nexus.config import ArchiveSettings
from nexus.datarepo.layout import LOTE_SUFFIX, PART_MARK, PARTS_SUFFIX
from nexus.datarepo.yamlio import read_yaml
from nexus.pipeline.hashing import sha256_file


@dataclass
class LoteReport:
    expanded: list[str] = field(default_factory=list)
    pending: list[str] = field(default_factory=list)
    errors: list[tuple[str, str]] = field(default_factory=list)


class LoteError(RuntimeError):
    pass


def _safe_member(name: str) -> PurePosixPath | None:
    path = PurePosixPath(name)
    if name.endswith("/") or path.is_absolute() or ".." in path.parts or not path.parts:
        return None
    return path


def _assemble(manifest: Path, workdir: Path) -> Path | None:
    """Junta as partes de um lote; None se ainda faltarem partes."""
    target = manifest.name.removesuffix(PARTS_SUFFIX)
    parts = sorted(manifest.parent.glob(f"{target}{PART_MARK}*"))
    data = read_yaml(manifest) or {}
    expected = int(data.get("parts", 0))
    if expected < 1 or len(parts) < expected:
        return None
    if len(parts) > expected:
        raise LoteError(f"partes a mais: {len(parts)} (esperadas {expected})")
    out = workdir / target
    with out.open("wb") as dest:
        for part in parts:
            with part.open("rb") as src:
                shutil.copyfileobj(src, dest)
    if out.stat().st_size != int(data.get("size", -1)) or sha256_file(out) != data.get("sha256"):
        raise LoteError("as partes não reconstituem o lote (SHA-256 diferente)")
    return out


def _extract(archive: Path, into: Path, settings: ArchiveSettings, max_file: int) -> int:
    with zipfile.ZipFile(archive) as zf:
        members = [m for m in zf.infolist() if not m.is_dir()]
        if len(members) > settings.max_entries:
            raise LoteError(f"lote com {len(members)} ficheiros (máximo {settings.max_entries})")
        total = sum(m.file_size for m in members)
        if total > settings.max_total_bytes:
            raise LoteError(f"lote com {total} bytes (máximo {settings.max_total_bytes})")
        for member in members:
            rel = _safe_member(member.filename)
            if rel is None:
                raise LoteError(f"caminho inválido no lote: {member.filename}")
            if member.file_size > max_file:
                raise LoteError(f"ficheiro demasiado grande no lote: {member.filename}")
            dest = into / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, dest.open("wb") as out:
                shutil.copyfileobj(src, out)
        return len(members)


def expand_lotes(deposit_root: Path, workdir: Path, settings: ArchiveSettings,
                 max_file: int) -> LoteReport:
    report = LoteReport()
    if not deposit_root.is_dir():
        return report
    work = workdir / "lotes"
    work.mkdir(parents=True, exist_ok=True)
    manifests = sorted(deposit_root.rglob(f"*{LOTE_SUFFIX}{PARTS_SUFFIX}"))
    singles = sorted(p for p in deposit_root.rglob(f"*{LOTE_SUFFIX}") if p.is_file())
    for source in [*manifests, *singles]:
        label = source.relative_to(deposit_root).as_posix()
        try:
            if source.name.endswith(PARTS_SUFFIX):
                archive = _assemble(source, work)
                if archive is None:
                    report.pending.append(label)
                    continue
                staged = [source, *source.parent.glob(
                    f"{source.name.removesuffix(PARTS_SUFFIX)}{PART_MARK}*")]
            else:
                archive, staged = source, [source]
            count = _extract(archive, source.parent, settings, max_file)
            for path in staged:
                path.unlink(missing_ok=True)
            report.expanded.append(f"{label} ({count} ficheiros)")
        except (LoteError, zipfile.BadZipFile, OSError) as exc:
            report.errors.append((label, str(exc)))
    return report
