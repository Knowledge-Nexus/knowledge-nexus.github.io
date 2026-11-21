// Pesquisa FTS5 sobre as partes da pesquisa (pesquisa-*.db.gz), espelho de
// backend/nexus/index/search.py: a mesma consulta em cada parte e os resultados juntos pelo
// mesmo critério (pontuação, documento, página). Lê também o esquema 1 (um só
// pesquisa.db.gz, com os metadados no próprio índice) até os índices serem reconstruídos.

import { normalize } from "../../lib/normalize";
import type { SearchFilters, SearchHit } from "../types";
import type { ReadonlyDb } from "./db";

export const HIGHLIGHT_START = "\u0002";
export const HIGHLIGHT_END = "\u0003";

/** Consulta do utilizador → MATCH seguro (nunca passa sintaxe FTS do utilizador). */
export function buildMatch(query: string): string | null {
  const tokens = normalize(query).split(" ").filter(Boolean).slice(0, 12);
  if (tokens.length === 0) return null;
  return `{text norm} : (${tokens.map((t) => `"${t}"*`).join(" AND ")})`;
}

/** Esquema 2: o texto em `pages` (uma vez) e o índice FTS5 com conteúdo externo. */
const SEARCH_SQL = `
SELECT p.doc_id, p.sha256, p.page, p.title,
       snippet(pages_fts, 0, char(2), char(3), '…', 16) AS snippet,
       p.unit, p.document_type, p.academic_year, bm25(pages_fts) AS score
FROM pages_fts JOIN pages AS p ON p.id = pages_fts.rowid
WHERE pages_fts MATCH :match
  AND (p.owner = :viewer OR p.visibility <> 'private')
  AND (:unit IS NULL OR p.unit = :unit)
  AND (:course IS NULL OR p.course = :course)
  AND (:document_type IS NULL OR p.document_type = :document_type)
  AND (:academic_year IS NULL OR p.academic_year = :academic_year)
ORDER BY score
LIMIT :limit`;

/** Esquema 1 (um só ficheiro, metadados no índice): até os índices serem reconstruídos. */
const SEARCH_SQL_V1 = `
SELECT doc_id, sha256, page, title,
       snippet(pages_fts, 0, char(2), char(3), '…', 16) AS snippet,
       unit, document_type, academic_year, bm25(pages_fts) AS score
FROM pages_fts
WHERE pages_fts MATCH :match
  AND (owner = :viewer OR visibility <> 'private')
  AND (:unit IS NULL OR unit = :unit)
  AND (:course IS NULL OR course = :course)
  AND (:document_type IS NULL OR document_type = :document_type)
  AND (:academic_year IS NULL OR academic_year = :academic_year)
ORDER BY score
LIMIT :limit`;

/** Os ficheiros da pesquisa num manifest.json: as partes ou, num índice antigo, o único. */
export function searchFiles(files: Record<string, unknown>, shards?: string[]): string[] {
  if (shards?.length) return shards;
  const parts = Object.keys(files)
    .filter((name) => /^pesquisa-[0-9a-f]+\.db\.gz$/.test(name))
    .sort();
  if (parts.length) return parts;
  if ("pesquisa.db.gz" in files) return ["pesquisa.db.gz"];
  return "pesquisa.db" in files ? ["pesquisa.db"] : [];
}

/** Os melhores de todas as partes, pelo mesmo critério do Python (`merge_hits`). */
export function mergeHits(hits: SearchHit[], limit: number): SearchHit[] {
  return [...hits]
    .sort(
      (a, b) =>
        a.score - b.score ||
        (a.doc_id < b.doc_id ? -1 : a.doc_id > b.doc_id ? 1 : 0) ||
        a.page - b.page,
    )
    .slice(0, limit);
}

export class SearchIndex {
  private readonly sql: string[];

  constructor(readonly shards: ReadonlyDb[]) {
    this.sql = shards.map((db) => {
      const row = db.all<{ value: string }>(
        "SELECT value FROM meta WHERE key = 'search_schema_version'",
      )[0];
      return Number(row?.value ?? 1) >= 2 ? SEARCH_SQL : SEARCH_SQL_V1;
    });
  }

  search(query: string, viewer: string, filters: SearchFilters = {}, limit = 50): SearchHit[] {
    const match = buildMatch(query);
    if (!match) return [];
    const params = {
      ":match": match,
      ":viewer": viewer,
      ":unit": filters.unit ?? null,
      ":course": filters.course ?? null,
      ":document_type": filters.document_type ?? null,
      ":academic_year": filters.academic_year ?? null,
      ":limit": limit,
    };
    const hits = this.shards.flatMap((db, i) => db.all<SearchHit>(this.sql[i]!, params));
    return mergeHits(hits, limit);
  }
}

/** Divide um excerto em pedaços com/sem destaque, para renderizar sem HTML cru. */
export function splitSnippet(snippet: string): { text: string; mark: boolean }[] {
  const parts: { text: string; mark: boolean }[] = [];
  let mark = false;
  let buffer = "";
  for (const ch of snippet) {
    if (ch === HIGHLIGHT_START || ch === HIGHLIGHT_END) {
      if (buffer) parts.push({ text: buffer, mark });
      buffer = "";
      mark = ch === HIGHLIGHT_START;
    } else {
      buffer += ch;
    }
  }
  if (buffer) parts.push({ text: buffer, mark });
  return parts;
}
