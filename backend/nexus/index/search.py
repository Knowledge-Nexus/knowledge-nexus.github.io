"""Pesquisa de texto integral: FTS5 do SQLite atrás de uma interface própria.

A base (`pesquisa.db`, publicada como `pesquisa.db.gz`) é lida no browser
(frontend/src/data/sqlite/search.ts), com a mesma construção de consulta. Na fase 5 troca-se
por full-text do PostgreSQL + pgvector implementando `SearchBackend`.
"""

from __future__ import annotations

import gzip
import shutil
import sqlite3
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from nexus.domain.text import normalize

SEARCH_SCHEMA_VERSION = 1
HIGHLIGHT_START = "\x02"
HIGHLIGHT_END = "\x03"

CREATE_FTS = """
CREATE VIRTUAL TABLE pages_fts USING fts5(
    text, norm,
    doc_id UNINDEXED, sha256 UNINDEXED, page UNINDEXED, owner UNINDEXED,
    visibility UNINDEXED, unit UNINDEXED, course UNINDEXED, document_type UNINDEXED,
    academic_year UNINDEXED, title UNINDEXED,
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


def create_search_db(path: Path, rows: list[PageRow], meta: dict[str, str]) -> None:
    path.unlink(missing_ok=True)
    con = sqlite3.connect(path)
    try:
        con.execute("CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        con.execute(CREATE_FTS)
        con.executemany(
            "INSERT INTO pages_fts (text, norm, doc_id, sha256, page, owner, visibility, unit,"
            " course, document_type, academic_year, title) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            [(r.text, normalize(r.text), r.doc_id, r.sha256, r.page, r.owner, r.visibility,
              r.unit, r.course, r.document_type, r.academic_year, r.title) for r in rows],
        )
        con.executemany("INSERT INTO meta (key, value) VALUES (?, ?)", sorted(meta.items()))
        con.execute("INSERT INTO pages_fts(pages_fts) VALUES ('optimize')")
        con.commit()
        con.execute("VACUUM")
    finally:
        con.close()


SEARCH_SQL = f"""
SELECT doc_id, sha256, page, title,
       snippet(pages_fts, 0, '{HIGHLIGHT_START}', '{HIGHLIGHT_END}', '…', 16) AS snippet,
       unit, document_type, academic_year, bm25(pages_fts) AS score
FROM pages_fts
WHERE pages_fts MATCH :match
  AND (owner = :viewer OR visibility <> 'private')
  AND (:unit IS NULL OR unit = :unit)
  AND (:course IS NULL OR course = :course)
  AND (:document_type IS NULL OR document_type = :document_type)
  AND (:academic_year IS NULL OR academic_year = :academic_year)
ORDER BY score
LIMIT :limit
"""


class SqliteFtsSearch:
    def __init__(self, path: Path) -> None:
        self._tempdir: tempfile.TemporaryDirectory[str] | None = None
        if path.suffix == ".gz":
            self._tempdir = tempfile.TemporaryDirectory(prefix="nexus-search-")
            self.path = Path(self._tempdir.name) / "pesquisa.db"
            with gzip.open(path, "rb") as source, self.path.open("wb") as target:
                shutil.copyfileobj(source, target)
        else:
            self.path = path

    def search(self, query: str, viewer: str, filters: SearchFilters | None = None,
               limit: int = 50) -> list[SearchHit]:
        match = build_match(query)
        if match is None:
            return []
        f = filters or SearchFilters()
        con = sqlite3.connect(f"file:{self.path}?mode=ro", uri=True)
        try:
            rows = con.execute(SEARCH_SQL, {
                "match": match, "viewer": viewer, "unit": f.unit, "course": f.course,
                "document_type": f.document_type, "academic_year": f.academic_year,
                "limit": limit,
            }).fetchall()
        finally:
            con.close()
        return [SearchHit(*row) for row in rows]
