// Consultas sobre meta.db. Os nomes de tabelas/colunas seguem
// backend/nexus/index/schema.py (SCHEMA_VERSION); o teste de contrato garante-o.

import type {
  CourseRow,
  CourseUnitRow,
  DocumentRow,
  InstitutionRow,
  NearDuplicate,
  ProposalRow,
  UnitRow,
  UserRow,
  VocabKind,
  VocabTerm,
} from "../types";
import type { ReadonlyDb } from "./db";

export const SUPPORTED_SCHEMA_VERSION = 2;

const JSON_DOC_COLUMNS = [
  "review_reasons",
  "classification",
  "sources",
  "history",
  "manifest",
] as const;

function parse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toDocument(row: Record<string, unknown>): DocumentRow {
  const out: Record<string, unknown> = { ...row };
  for (const column of JSON_DOC_COLUMNS) {
    out[column] = parse(
      row[column],
      column === "manifest" ? null : column === "classification" ? {} : [],
    );
  }
  out.needs_review = Boolean(row.needs_review);
  out.visibility_inherited = Boolean(row.visibility_inherited);
  return out as unknown as DocumentRow;
}

export interface DocumentFilter {
  owner?: string;
  unit?: string;
  course?: string;
  documentType?: string;
  academicYear?: string;
  filedOnly?: boolean;
  includeArchives?: boolean;
}

export class MetaIndex {
  constructor(readonly db: ReadonlyDb) {}

  meta(): Record<string, string> {
    const rows = this.db.all<{ key: string; value: string }>("SELECT key, value FROM meta");
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  schemaVersion(): number {
    return Number(this.meta().schema_version ?? 0);
  }

  institutions(): InstitutionRow[] {
    return this.db.all("SELECT * FROM institutions ORDER BY name");
  }

  courses(): CourseRow[] {
    return this.db.all("SELECT * FROM courses ORDER BY name");
  }

  units(): UnitRow[] {
    return this.db
      .all<Record<string, unknown>>("SELECT * FROM units ORDER BY name")
      .map((u) => ({ ...u, lecturers: parse<string[]>(u.lecturers, []) }) as UnitRow);
  }

  courseUnits(): CourseUnitRow[] {
    return this.db.all(
      "SELECT * FROM course_units ORDER BY course_key, curricular_year, semester, unit_key",
    );
  }

  vocab(kind: VocabKind): VocabTerm[] {
    return this.db
      .all<Record<string, unknown>>("SELECT * FROM vocab_terms WHERE kind = ? ORDER BY sort", [
        kind,
      ])
      .map(
        (t) =>
          ({
            ...t,
            labels: parse(t.labels, {}),
            is_assessment: Boolean(t.is_assessment),
            is_submission: Boolean(t.is_submission),
            is_syllabus: Boolean(t.is_syllabus),
            is_fallback: Boolean(t.is_fallback),
          }) as VocabTerm,
      );
  }

  users(): UserRow[] {
    return this.db.all<Record<string, unknown>>("SELECT * FROM users").map(
      (u) =>
        ({
          ...u,
          preferences: parse(u.preferences, {}),
          enrollments: parse(u.enrollments, {}),
          sharing: parse(u.sharing, {}),
        }) as UserRow,
    );
  }

  /** Escolhas de visibilidade por cadeira feitas pelo dono ({chave: visibilidade}). */
  unitVisibility(owner: string): Record<string, string> {
    return this.users().find((u) => u.login === owner)?.sharing.units ?? {};
  }

  documents(filter: DocumentFilter = {}): DocumentRow[] {
    const where: string[] = [];
    const bind: Record<string, unknown> = {};
    const add = (sql: string, key: string, value: unknown) => {
      if (value === undefined || value === "") return;
      where.push(sql);
      bind[key] = value;
    };
    add("owner = :owner", ":owner", filter.owner);
    add("unit = :unit", ":unit", filter.unit);
    add("course = :course", ":course", filter.course);
    add("document_type = :type", ":type", filter.documentType);
    add("academic_year = :year", ":year", filter.academicYear);
    if (filter.filedOnly) where.push("status IN ('filed', 'enriched', 'reviewed')");
    if (!filter.includeArchives) where.push("kind <> 'archive'");
    const sql = `SELECT * FROM documents ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY academic_year DESC, display_name`;
    return this.db.all<Record<string, unknown>>(sql, bind).map(toDocument);
  }

  document(id: string): DocumentRow | undefined {
    const row = this.db.get<Record<string, unknown>>("SELECT * FROM documents WHERE id = ?", [id]);
    return row ? toDocument(row) : undefined;
  }

  children(id: string): DocumentRow[] {
    return this.db
      .all<Record<string, unknown>>(
        "SELECT * FROM documents WHERE parent = ? ORDER BY source_path",
        [id],
      )
      .map(toDocument);
  }

  reviewQueue(owner?: string): DocumentRow[] {
    const sql = `SELECT * FROM documents WHERE needs_review = 1 AND kind <> 'archive'
      ${owner ? "AND owner = ?" : ""} ORDER BY created_at DESC, id DESC`;
    return this.db.all<Record<string, unknown>>(sql, owner ? [owner] : []).map(toDocument);
  }

  unfiled(owner?: string): DocumentRow[] {
    const sql = `SELECT * FROM documents WHERE status IN ('received', 'extracted', 'classified')
      AND kind <> 'archive' ${owner ? "AND owner = ?" : ""} ORDER BY created_at DESC`;
    return this.db.all<Record<string, unknown>>(sql, owner ? [owner] : []).map(toDocument);
  }

  proposals(status: ProposalRow["status"] = "open"): ProposalRow[] {
    return this.db
      .all<Record<string, unknown>>("SELECT * FROM proposals WHERE status = ? ORDER BY id", [
        status,
      ])
      .map(
        (p) =>
          ({
            ...p,
            data: parse(p.data, {}),
            evidence: parse(p.evidence, []),
          }) as unknown as ProposalRow,
      );
  }

  nearDuplicates(id: string): NearDuplicate[] {
    return this.db.all(
      `SELECT CASE WHEN doc_a = :id THEN doc_b ELSE doc_a END AS other, distance, score
       FROM near_duplicates WHERE doc_a = :id OR doc_b = :id ORDER BY score DESC`,
      { ":id": id },
    );
  }

  knownSha(sha256: string): boolean {
    return Boolean(this.db.get("SELECT 1 AS x FROM documents WHERE sha256 = ? LIMIT 1", [sha256]));
  }

  recent(owner: string, limit = 6): DocumentRow[] {
    return this.db
      .all<Record<string, unknown>>(
        `SELECT * FROM documents WHERE owner = ? AND kind <> 'archive'
         ORDER BY created_at DESC, id DESC LIMIT ?`,
        [owner, limit],
      )
      .map(toDocument);
  }

  /** Nº de documentos arrumados por cadeira (e total, incluindo os por arrumar). */
  unitStats(owner: string): Map<string, { filed: number; total: number }> {
    const rows = this.db.all<{ unit: string; filed: number; total: number }>(
      `SELECT unit, sum(status IN ('filed', 'enriched', 'reviewed')) AS filed, count(*) AS total
       FROM documents WHERE owner = ? AND kind <> 'archive' AND unit IS NOT NULL GROUP BY unit`,
      [owner],
    );
    return new Map(rows.map((r) => [r.unit, { filed: r.filed, total: r.total }]));
  }

  academicYears(): string[] {
    return this.db
      .all<{ academic_year: string }>(
        "SELECT DISTINCT academic_year FROM documents WHERE academic_year IS NOT NULL ORDER BY 1 DESC",
      )
      .map((r) => r.academic_year);
  }

  counts(owner?: string): { total: number; review: number; filed: number } {
    const row = this.db.get<{ total: number; review: number; filed: number }>(
      `SELECT count(*) AS total, sum(needs_review) AS review,
        sum(status IN ('filed', 'enriched', 'reviewed')) AS filed
       FROM documents WHERE kind <> 'archive' ${owner ? "AND owner = ?" : ""}`,
      owner ? [owner] : [],
    );
    return { total: row?.total ?? 0, review: row?.review ?? 0, filed: row?.filed ?? 0 };
  }
}
