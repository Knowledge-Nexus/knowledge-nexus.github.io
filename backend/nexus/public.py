"""Publicação do material que o dono marcou como público.

O repositório de dados continua sempre privado. O que tem visibilidade efectiva `public`
é copiado para um repositório PÚBLICO separado (`publishing.public_repo` no `nexus.yaml`),
servido pelo GitHub Pages em `https://<dono>.github.io/<nome>/`, onde a interface o lê em
modo de visitante (`#/publico`). Esse repositório tem um único commit, reescrito a cada
publicação: deixar de partilhar remove o material de lá (sem ficar no histórico dele).

Nada pessoal sai: nem notas, nem caminhos de origem, nem histórico, nem revisões.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import shutil
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from nexus import clock
from nexus.datarepo.git import Git, GitError
from nexus.datarepo.store import DataRepo
from nexus.domain.documents import Document, DocumentKind
from nexus.domain.visibility import is_public
from nexus.index.builder import MANIFEST, build_indices

REPO_RE = re.compile(r"^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$")
_GITHUB_SLUG_RE = re.compile(r"github\.com[:/]+([A-Za-z0-9-]+/[A-Za-z0-9._-]+?)(?:\.git)?/?$")

INDEX_HTML = """<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=../#/publico">
<title>Material público</title>
</head>
<body><p><a href="../#/publico">Abrir o material público</a></p></body>
</html>
"""

README = """# Material público (gerado)

Este repositório é gerado automaticamente pelo Knowledge Nexus a partir do material que o
dono marcou como público. Não o edites: cada publicação substitui todo o conteúdo.
Para veres o material, abre https://knowledge-nexus.github.io/#/publico
"""


class PublishError(RuntimeError):
    pass


@dataclass
class PublicResult:
    configured: bool
    target: str | None = None
    documents: int = 0
    digest: str | None = None
    published: bool = False
    missing_token: bool = False
    commit: str | None = None
    notes: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def public_documents(repo: DataRepo) -> list[Document]:
    users = repo.users
    return sorted((d for d in repo.documents.values()
                   if d.kind is not DocumentKind.ARCHIVE and is_public(d, users)),
                  key=lambda d: d.id)


def github_slug(url: str | None) -> str | None:
    match = _GITHUB_SLUG_RE.search(url or "")
    return match.group(1).lower() if match else None


def _read_original(repo: DataRepo, git: Git, doc: Document) -> bytes:
    path = repo.layout.original_path(doc.blob.sha256, doc.blob.ext)
    if path.exists():
        return path.read_bytes()
    # No Actions, `originais/` fica fora do sparse checkout: lê-se do git (a pedido).
    try:
        return git.show("HEAD", repo.layout.relative(path))
    except GitError as exc:
        if repo.settings.storage.backend != "r2":
            raise PublishError(f"original em falta para {doc.id}: {exc}") from exc
    from nexus.storage.r2 import open_blob_store

    store = open_blob_store(repo.layout, repo.settings.storage)
    with tempfile.TemporaryDirectory() as tmp:
        try:
            found = store.materialize(doc.blob.sha256, doc.blob.ext, Path(tmp))
        except FileNotFoundError as exc:
            raise PublishError(f"original em falta para {doc.id}: {exc}") from exc
        return found.read_bytes()


def _digest(directory: Path) -> str:
    h = hashlib.sha256()
    for path in sorted(p for p in directory.rglob("*") if p.is_file()):
        rel = path.relative_to(directory).as_posix()
        if rel == MANIFEST:
            continue
        h.update(rel.encode() + b"\0" + hashlib.sha256(path.read_bytes()).digest())
    return h.hexdigest()


def build_public_site(repo: DataRepo, out: Path) -> tuple[int, str]:
    """Gera o conteúdo do repositório público. Devolve (nº de documentos, resumo)."""
    git = Git(repo.root)
    docs = public_documents(repo)
    copied: set[str] = set()
    for doc in docs:
        sha = doc.blob.sha256
        if sha in copied:
            continue
        copied.add(sha)
        target = out / repo.layout.relative(repo.layout.original_path(sha, doc.blob.ext))
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(_read_original(repo, git, doc))
        text_dir = repo.layout.text_dir(sha)
        pages = text_dir / "paginas"
        if pages.is_dir():
            shutil.copytree(pages, out / repo.layout.relative(pages))
        extraction = repo.extraction_meta(sha)
        if extraction and extraction.rendition and (text_dir / extraction.rendition).exists():
            rendition = text_dir / extraction.rendition
            (out / repo.layout.relative(rendition)).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(rendition, out / repo.layout.relative(rendition))
    build_indices(repo, out, public=True)
    (out / ".nojekyll").write_text("", encoding="utf-8")
    (out / "index.html").write_text(INDEX_HTML, encoding="utf-8")
    (out / "README.md").write_text(README, encoding="utf-8")
    digest = _digest(out)
    manifest = json.loads((out / MANIFEST).read_text(encoding="utf-8"))
    manifest.update({"content_digest": digest, "documents": len(docs),
                     "owner": str(repo.raw_settings.get("owner", ""))})
    (out / MANIFEST).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return len(docs), digest


def _auth_env(token: str | None) -> dict[str, str]:
    if not token:
        return {}
    basic = base64.b64encode(f"x-access-token:{token}".encode()).decode()
    return {"GIT_CONFIG_COUNT": "1",
            "GIT_CONFIG_KEY_0": "http.https://github.com/.extraheader",
            "GIT_CONFIG_VALUE_0": f"AUTHORIZATION: basic {basic}",
            "GIT_TERMINAL_PROMPT": "0"}


def _check_target(repo: DataRepo, target: str) -> None:
    if not REPO_RE.match(target):
        raise PublishError(f"publishing.public_repo inválido (usa dono/nome): {target}")
    forbidden = {github_slug(Git(repo.root).remote_url())}
    app = repo.raw_settings.get("app")
    if isinstance(app, dict) and app.get("repository"):
        forbidden.add(str(app["repository"]).lower())
    if target.lower() in forbidden:
        raise PublishError(
            f"{target} não pode receber o material público: é o repositório de dados ou o "
            "da aplicação. Usa um repositório próprio (ex.: estudo-publico).")


def publish_public(root: Path, token: str | None = None, push: bool = True,
                   remote_url: str | None = None) -> PublicResult:
    """Publica o material público. Idempotente: se o conteúdo não mudou, não faz push."""
    repo = DataRepo(root)
    settings = repo.settings.publishing
    target = settings.public_repo
    if not target:
        return PublicResult(configured=False, notes=["publicação não configurada"])
    _check_target(repo, target)
    result = PublicResult(configured=True, target=target)
    url = remote_url or f"https://github.com/{target}.git"
    env = _auth_env(token)
    with tempfile.TemporaryDirectory(prefix="nexus-publico-") as tmp:
        site = Path(tmp) / "site"
        site.mkdir()
        result.documents, result.digest = build_public_site(repo, site)
        work = Git(Path(tmp) / "git")
        work.root.mkdir()
        work.run("init", "-q")
        remote_digest: str | None = None
        # O ramo pode ainda não existir (repositório acabado de criar).
        work.run("fetch", "-q", "--depth=1", url, settings.public_branch, check=False, env=env)
        if work.run("rev-parse", "-q", "--verify", "FETCH_HEAD", check=False):
            try:
                remote_digest = json.loads(work.show("FETCH_HEAD", MANIFEST)).get(
                    "content_digest")
            except (GitError, json.JSONDecodeError):
                remote_digest = None
        if remote_digest == result.digest:
            result.notes.append("material público já actualizado")
            return result
        if not push:
            result.notes.append("publicação por enviar (--sem-push)")
            return result
        if not token and os.environ.get("GITHUB_ACTIONS") == "true":
            result.missing_token = True
            result.notes.append("falta o segredo NEXUS_PUBLICO_TOKEN no repositório de dados")
            return result
        stamp = clock.now().strftime("%Y-%m-%d %H:%M")
        result.commit = work.publish_directory(
            site, settings.public_branch,
            f"nexus: material público ({result.documents} documentos, {stamp})",
            remote=url, env=env)
        result.published = True
    return result
