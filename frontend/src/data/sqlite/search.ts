// Pesquisa FTS5 sobre pesquisa.db, espelho de backend/nexus/index/search.py.

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

const SEARCH_SQL = `
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

export class SearchIndex {
  constructor(readonly db: ReadonlyDb) {}

  search(query: string, viewer: string, filters: SearchFilters = {}, limit = 50): SearchHit[] {
    const match = buildMatch(query);
    if (!match) return [];
    return this.db.all<SearchHit>(SEARCH_SQL, {
      ":match": match,
      ":viewer": viewer,
      ":unit": filters.unit ?? null,
      ":course": filters.course ?? null,
      ":document_type": filters.document_type ?? null,
      ":academic_year": filters.academic_year ?? null,
      ":limit": limit,
    });
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
