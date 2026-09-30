"""`nexus vigiar`: pasta de depósito local (ex.: no Windows via WSL2) → repositório de dados.

- Envia pela API do GitHub (não precisa de clonar o repositório com os originais).
- Cada ronda gera um lote `deposito/<login>/<lote>/…` num único commit; as pastas
  largadas mantêm os caminhos relativos (projectos de código ficam juntos).
- O ficheiro local SÓ sai da pasta depois de o pipeline o processar com sucesso: vai
  para `_enviados/<lote>/`; se falhar no pipeline, vai para `_erros/<lote>/`.
- O estado dos lotes pendentes fica em `.nexus-vigiar.json` na própria pasta.
"""

from __future__ import annotations

import contextlib
import hashlib
import json
import logging
import shutil
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

import yaml

from nexus.config import load_settings
from nexus.datarepo.layout import PART_MARK, PARTS_SUFFIX
from nexus.github.api import GitHub, Repo
from nexus.pipeline.filetypes import is_junk

log = logging.getLogger("nexus.vigiar")

STATE_FILE = ".nexus-vigiar.json"
SENT_DIR = "_enviados"
ERRORS_DIR = "_erros"
MAX_BYTES = 95 * 1024 * 1024
PART_BYTES = 10 * 1024 * 1024
STABLE_SECONDS = 3.0


class Api(Protocol):
    def user(self) -> str: ...

    def repo_info(self, repo: Repo) -> dict[str, Any]: ...

    def list_dir(self, repo: Repo, path: str) -> list[str] | None: ...

    def commit_files(self, repo: Repo, files: dict[str, bytes], message: str) -> str: ...


@dataclass
class Pending:
    batch: str
    files: list[str]  # caminhos relativos à pasta vigiada
    commit: str
    sent_at: str


@dataclass
class WatchState:
    pending: list[Pending] = field(default_factory=list)

    @classmethod
    def load(cls, folder: Path) -> WatchState:
        path = folder / STATE_FILE
        if not path.exists():
            return cls()
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls([Pending(**p) for p in data.get("pending", [])])

    def save(self, folder: Path) -> None:
        data = {"pending": [p.__dict__ for p in self.pending]}
        (folder / STATE_FILE).write_text(json.dumps(data, indent=2, ensure_ascii=False),
                                         encoding="utf-8")


def split_for_upload(target: str, rel: str, data: bytes) -> dict[str, bytes]:
    """A API do GitHub recusa blobs grandes: acima de PART_BYTES vai em partes + manifesto
    (o motor junta-as e confirma o SHA-256; igual à interface, `data/source.ts`)."""
    if len(data) <= PART_BYTES:
        return {target: data}
    count = -(-len(data) // PART_BYTES)
    out = {f"{target}{PART_MARK}{i + 1:04d}": data[i * PART_BYTES:(i + 1) * PART_BYTES]
           for i in range(count)}
    manifest = {"path": rel, "size": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                "parts": count}
    out[f"{target}{PARTS_SUFFIX}"] = yaml.safe_dump(manifest, sort_keys=True).encode()
    return out


def batch_id(now: datetime | None = None) -> str:
    stamp = (now or datetime.now(UTC)).strftime("%Y%m%dT%H%M%SZ")
    return f"{stamp}-{int(time.time_ns()) % 46656:03x}w"[:25]


def candidate_files(folder: Path, pending: set[str]) -> list[str]:
    ignored = set(load_settings().code_projects.ignored_dirs)
    out: list[str] = []
    for path in sorted(folder.rglob("*")):
        if not path.is_file() or path.is_symlink():
            continue
        rel = path.relative_to(folder).as_posix()
        top = rel.split("/", 1)[0]
        if top in {SENT_DIR, ERRORS_DIR, STATE_FILE} or rel in pending:
            continue
        if is_junk(path.name) or any(p in ignored for p in rel.split("/")[:-1]):
            continue
        out.append(rel)
    return out


def _stable(folder: Path, files: list[str], wait: float) -> list[str]:
    """Só ficheiros cujo tamanho não mudou durante `wait` segundos (cópias em curso)."""
    before = {f: (folder / f).stat().st_size for f in files}
    if wait:
        time.sleep(wait)
    return [f for f in files if (folder / f).exists() and (folder / f).stat().st_size == before[f]]


def _move(folder: Path, rel: str, target_root: str, batch: str) -> None:
    source = folder / rel
    if not source.exists():
        return
    target = folder / target_root / batch / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(source, target)


def _remove_empty_dirs(folder: Path) -> None:
    for directory in sorted((p for p in folder.rglob("*") if p.is_dir()), reverse=True):
        if directory.name in {SENT_DIR, ERRORS_DIR}:
            continue
        with contextlib.suppress(OSError):
            directory.rmdir()


class Watcher:
    def __init__(self, folder: Path, api: Api, repo: Repo, login: str,
                 stable_seconds: float = STABLE_SECONDS) -> None:
        self.folder = folder
        self.api = api
        self.repo = repo
        self.login = login
        self.stable_seconds = stable_seconds
        self.state = WatchState.load(folder)
        self.lock = threading.Lock()

    def send_new(self) -> Pending | None:
        with self.lock:
            pending = {f for p in self.state.pending for f in p.files}
            files = _stable(self.folder, candidate_files(self.folder, pending),
                            self.stable_seconds)
            if not files:
                return None
            batch = batch_id()
            payload: dict[str, bytes] = {}
            for rel in files:
                path = self.folder / rel
                if path.stat().st_size > MAX_BYTES:
                    _move(self.folder, rel, ERRORS_DIR, batch)
                    (self.folder / ERRORS_DIR / batch / f"{rel}.log").write_text(
                        "ficheiro com mais de 95 MB (o GitHub recusa ficheiros > 100 MB)\n",
                        encoding="utf-8")
                    continue
                payload.update(split_for_upload(f"deposito/{self.login}/{batch}/{rel}", rel,
                                                path.read_bytes()))
            if not payload:
                return None
            commit = self.api.commit_files(self.repo, payload,
                                           f"depósito: {len(payload)} ficheiro(s) ({batch})")
            sent = [rel for rel in files if (self.folder / rel).exists()]
            entry = Pending(batch, sent, commit, datetime.now(UTC).isoformat())
            self.state.pending.append(entry)
            self.state.save(self.folder)
            log.info("enviado lote %s (%d ficheiros)", batch, len(sent))
            return entry

    def settle(self) -> list[tuple[str, str]]:
        """Verifica os lotes pendentes; move localmente os já processados. Devolve
        (ficheiro, destino) para o que foi movido."""
        moved: list[tuple[str, str]] = []
        with self.lock:
            remaining: list[Pending] = []
            for entry in self.state.pending:
                still = self.api.list_dir(self.repo, f"deposito/{self.login}/{entry.batch}")
                if still:
                    remaining.append(entry)
                    continue
                failed = set(self.api.list_dir(
                    self.repo, f"deposito/{self.login}/{ERRORS_DIR}/{entry.batch}") or [])
                for rel in entry.files:
                    top = rel.split("/", 1)[0]
                    target = ERRORS_DIR if top in failed or rel in failed else SENT_DIR
                    _move(self.folder, rel, target, entry.batch)
                    moved.append((rel, target))
            self.state.pending = remaining
            self.state.save(self.folder)
            _remove_empty_dirs(self.folder)
        return moved


def watch(folder: Path, repository: str, token: str, once: bool = False,
          force_polling: bool = False, interval: float = 30.0,
          api_factory: Callable[[str], Api] = GitHub) -> None:
    folder = folder.resolve()
    folder.mkdir(parents=True, exist_ok=True)
    api = api_factory(token)
    repo = Repo.parse(repository)
    info = api.repo_info(repo)
    if not info.get("private"):
        raise SystemExit("recusado: o repositório de dados tem de ser PRIVADO")
    repo = Repo(repo.owner, repo.name, str(info.get("default_branch") or "main"))
    watcher = Watcher(folder, api, repo, api.user())
    print(f"a vigiar {folder} → {repository} (Ctrl+C para parar)")
    watcher.send_new()
    watcher.settle()
    if once:
        return

    from watchdog.events import FileSystemEvent, FileSystemEventHandler
    from watchdog.observers import Observer
    from watchdog.observers.polling import PollingObserver

    changed = threading.Event()

    class Handler(FileSystemEventHandler):
        def on_any_event(self, event: FileSystemEvent) -> None:
            if STATE_FILE not in str(event.src_path):
                changed.set()

    # Em /mnt/c (Windows visto do WSL2) o inotify não funciona: usar polling.
    use_polling = force_polling or str(folder).startswith("/mnt/")
    observer = PollingObserver(timeout=5) if use_polling else Observer()
    observer.schedule(Handler(), str(folder), recursive=True)
    observer.start()
    try:
        while True:
            if changed.wait(timeout=interval):
                changed.clear()
                watcher.send_new()
            for rel, target in watcher.settle():
                print(f"{rel} → {target}/")
    except KeyboardInterrupt:
        pass
    finally:
        observer.stop()
        observer.join()
