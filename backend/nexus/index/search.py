"""Pesquisa de texto integral: FTS5 do SQLite atrás de uma interface própria.

A base de pesquisa é publicada em partes (`pesquisa-00.db.gz`… no ramo `indices`): cada
documento vai para a parte dada pelo início do seu SHA-256, por isso cada ficheiro fica muito
abaixo do limite de 100 MB do GitHub e as partes que não mudaram ficam iguais byte a byte (o
git não as volta a enviar e o browser não as volta a descarregar). Em cada parte, o texto de
cada página guarda-se uma vez (`pages`) e o índice FTS5 usa-o como conteúdo externo; a versão
normalizada (`norm`) só entra no índice. O browser lê as partes
(frontend/src/data/sqlite/search.ts) com a mesma consulta e junta os resultados da mesma
forma. Na fase 5 troca-se por full-text do PostgreSQL + pgvector implementando `SearchBackend`.
"""

from __future__ import annotations

import gzip
import json
import shutil
import sqlite3
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from nexus.domain.text import normalize

SEARCH_SCHEMA_VERSION = 2
HIGHLIGHT_START = "\x02"
HIGHLIGHT_END = "\x03"

SHARD_PREFIX = "pesquisa-"
SHARD_SUFFIX = ".db.gz"
DEFAULT_SHARDS = 16
MAX_SHARDS = 256
# O GitHub recusa ficheiros acima de 100 MB: com uma parte acima disto, dobra-se o número de
# partes.
MAX_SHARD_BYTES = 90 * 1024 * 1024

CREATE_PAGES = """
CREATE TABLE pages (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    norm TEXT NOT NULL DEFAULT '',
    doc_id TEXT NOT NULL, sha256 TEXT NOT NULL, page INTEGER NOT NULL, owner TEXT NOT NULL,
    visibility TEXT NOT NULL, unit TEXT, course TEXT, document_type TEXT,
    academic_year TEXT, title TEXT NOT NULL
)
"""
# Conteúdo externo: o texto está em `pages` (uma vez). `norm` fica vazio em `pages` e só
# entra no índice (é o mesmo texto, normalizado: não vale a pena guardá-lo duas vezes).
CREATE_FTS = """
CREATE VIRTUAL TABLE pages_fts USING fts5(
    text, norm, content = 'pages', content_rowid = 'id',
    tokenize = 'unicode61 remove_diacritics 2'
)
"""


@dataclass
class SearchFilters:
    unit: str | None = None
    course: str | None = None
    document_type: str | None = None
    academic_year: str | None = None


@dataclass
class SearchHit:
    doc_id: str
    sha256: str
    page: int
    title: str
    snippet: str
    unit: str | None
    document_type: str | None
    academic_year: str | None
    score: float


@dataclass
class PageRow:
    text: str
    doc_id: str
    sha256: str
    page: int
    owner: str
    visibility: str
    unit: str | None
    course: str | None
    document_type: str | None
    academic_year: str | None
    title: str
    extra: dict[str, str] = field(default_factory=dict)


class SearchBackend(Protocol):
    def search(self, query: str, viewer: str, filters: SearchFilters | None = None,
               limit: int = 50) -> list[SearchHit]: ...


def build_match(query: str) -> str | None:
    """Consulta do utilizador → expressão MATCH do FTS5 (prefixos, E lógico).

    Os termos são normalizados como o texto indexado (sem acentos, grafias unificadas) e
    procurados nas colunas `text` e `norm`. Nunca passa sintaxe FTS do utilizador.
    """
    tokens = normalize(query).split()
    if not tokens:
        return None
    phrases = " AND ".join(f'"{t}"*' for t in tokens[:12])
    return "{text norm} : (" + phrases + ")"


def shard_name(index: int) -> str:
    return f"{SHARD_PREFIX}{index:02x}{SHARD_SUFFIX}"


def shard_of(sha256: str, shards: int) -> int:
    """A parte de um documento: o início do SHA-256 (estável, igual em todo o lado)."""
    return int(sha256[:4], 16) % shards


def create_search_db(path: Path, rows: list[PageRow], meta: dict[str, str]) -> None:
    """Uma base de pesquisa (uma parte). Só com o que lá se põe, sem datas: as mesmas páginas
    dão o mesmo ficheiro, byte a byte."""
    path.unlink(missing_ok=True)
    con = sqlite3.connect(path)
    try:
        con.execute("CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        con.execute(CREATE_PAGES)
        con.execute(CREATE_FTS)
        for number, r in enumerate(rows, start=1):
            con.execute(
                "INSERT INTO pages (id, text, doc_id, sha256, page, owner, visibility, unit,"
                " course, document_type, academic_year, title)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (number, r.text, r.doc_id, r.sha256, r.page, r.owner, r.visibility, r.unit,
                 r.course, r.document_type, r.academic_year, r.title),
            )
            con.execute("INSERT INTO pages_fts (rowid, text, norm) VALUES (?, ?, ?)",
                        (number, r.text, normalize(r.text)))
        con.executemany("INSERT INTO meta (key, value) VALUES (?, ?)", sorted(meta.items()))
        con.execute("INSERT INTO pages_fts(pages_fts) VALUES ('optimize')")
        con.commit()
        con.execute("VACUUM")
    finally:
        con.close()


def _gzip(source: Path, target: Path) -> None:
    with (source.open("rb") as raw, target.open("wb") as out,
          gzip.GzipFile(filename="", mode="wb", fileobj=out, mtime=0) as compressed):
        while chunk := raw.read(1024 * 1024):
            compressed.write(chunk)


def write_search_shards(out: Path, rows: list[PageRow], meta: dict[str, str]) -> list[str]:
    """Escreve as partes da pesquisa em `out` e devolve os nomes, por ordem. Começa em 16
    partes e dobra enquanto alguma passar de `MAX_SHARD_BYTES` (comprimida)."""
    ordered = sorted(rows, key=lambda r: (r.sha256, r.doc_id, r.page))
    shards = DEFAULT_SHARDS
    while True:
        names = [shard_name(i) for i in range(shards)]
        buckets: list[list[PageRow]] = [[] for _ in range(shards)]
        for row in ordered:
            buckets[shard_of(row.sha256, shards)].append(row)
        raw = out / ".pesquisa.db"
        for index, bucket in enumerate(buckets):
            create_search_db(raw, bucket, {**meta, "shard": str(index), "shards": str(shards)})
            _gzip(raw, out / names[index])
        raw.unlink(missing_ok=True)
        biggest = max((out / name).stat().st_size for name in names)
        if biggest <= MAX_SHARD_BYTES:
            return names
        for name in names:
            (out / name).unlink()
        if shards >= MAX_SHARDS:
            raise ValueError(f"a pesquisa não cabe em {MAX_SHARDS} partes de "
                             f"{MAX_SHARD_BYTES // 2**20} MB")
        shards *= 2


def shard_files(manifest: dict[str, object]) -> list[str]:
    """Os ficheiros da pesquisa listados num manifest.json, por ordem."""
    search = manifest.get("search")
    if isinstance(search, dict) and isinstance(search.get("shards"), list):
        return [str(name) for name in search["shards"]]
    files = manifest.get("files")
    return sorted(name for name in (files if isinstance(files, dict) else {})
                  if name.startswith(SHARD_PREFIX) and name.endswith(SHARD_SUFFIX))


SEARCH_SQL = f"""
SELECT p.doc_id, p.sha256, p.page, p.title,
       snippet(pages_fts, 0, '{HIGHLIGHT_START}', '{HIGHLIGHT_END}', '…', 16) AS snippet,
       p.unit, p.document_type, p.academic_year, bm25(pages_fts) AS score
FROM pages_fts JOIN pages AS p ON p.id = pages_fts.rowid
WHERE pages_fts MATCH :match
  AND (p.owner = :viewer OR p.visibility <> 'private')
  AND (:unit IS NULL OR p.unit = :unit)
  AND (:course IS NULL OR p.course = :course)
  AND (:document_type IS NULL OR p.document_type = :document_type)
  AND (:academic_year IS NULL OR p.academic_year = :academic_year)
ORDER BY score
LIMIT :limit
"""


def merge_hits(hits: list[SearchHit], limit: int) -> list[SearchHit]:
    """Os melhores de todas as partes (o mesmo critério no browser)."""
    return sorted(hits, key=lambda h: (h.score, h.doc_id, h.page))[:limit]


class SqliteFtsSearch:
    """Pesquisa sobre as partes publicadas (`pesquisa-*.db.gz`) de uma pasta de índices."""

    def __init__(self, paths: list[Path]) -> None:
        self._tempdir = tempfile.TemporaryDirectory(prefix="nexus-search-")
        self.paths: list[Path] = []
        for index, path in enumerate(paths):
            if path.suffix == ".gz":
                target = Path(self._tempdir.name) / f"{index:03d}.db"
                with gzip.open(path, "rb") as source, target.open("wb") as out:
                    shutil.copyfileobj(source, out)
                self.paths.append(target)
            else:
                self.paths.append(path)

    @classmethod
    def from_dir(cls, directory: Path) -> SqliteFtsSearch:
        manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
        return cls([directory / name for name in shard_files(manifest)])

    def search(self, query: str, viewer: str, filters: SearchFilters | None = None,
               limit: int = 50) -> list[SearchHit]:
        match = build_match(query)
        if match is None:
            return []
        f = filters or SearchFilters()
        params = {
            "match": match, "viewer": viewer, "unit": f.unit, "course": f.course,
            "document_type": f.document_type, "academic_year": f.academic_year,
            "limit": limit,
        }
        hits: list[SearchHit] = []
        for path in self.paths:
            con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
            try:
                hits += [SearchHit(*row) for row in con.execute(SEARCH_SQL, params).fetchall()]
            finally:
                con.close()
        return merge_hits(hits, limit)
