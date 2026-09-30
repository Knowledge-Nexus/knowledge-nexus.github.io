// Tipos das linhas do índice meta.db (ver backend/nexus/index/schema.py) e dos registos YAML.

export type Status = "received" | "extracted" | "classified" | "filed" | "enriched" | "reviewed";
export type DocumentKind = "file" | "archive" | "code_project";

export const CLASSIFICATION_FIELDS = [
  "unit",
  "document_type",
  "academic_year",
  "assessment_type",
  "exam_season",
  "assessment_number",
  "role",
  "solution_origin",
  "topics",
] as const;
export type ClassificationField = (typeof CLASSIFICATION_FIELDS)[number];

export interface Reason {
  code: string;
  params?: Record<string, unknown>;
  source?: string;
  weight?: number;
}

export interface Alternative {
  value: unknown;
  confidence: number;
}

export interface FieldValue {
  value: unknown;
  confidence: number;
  method: string;
  reasons?: Reason[];
  alternatives?: Alternative[];
}

export type Classification = Partial<Record<ClassificationField, FieldValue>>;

export interface Source {
  via: string;
  path: string;
  batch?: string;
  received_at?: string;
}

export interface HistoryEntry {
  status: Status;
  at: string;
}

export interface ManifestFile {
  path: string;
  size: number;
  sha256: string;
}

export interface CodeManifest {
  root: string;
  files: ManifestFile[];
  ignored: { path: string; files: number; bytes: number }[];
}

export interface DocumentRow {
  id: string;
  owner: string;
  kind: DocumentKind;
  sha256: string;
  size: number;
  ext: string;
  mime: string;
  original_path: string;
  parent: string | null;
  visibility: string;
  status: Status;
  display_name: string;
  source_path: string | null;
  batch: string | null;
  created_at: string | null;
  unit: string | null;
  course: string | null;
  document_type: string | null;
  academic_year: string | null;
  assessment_type: string | null;
  exam_season: string | null;
  assessment_number: number | null;
  role: string | null;
  solution_origin: string | null;
  confidence: number | null;
  needs_review: boolean;
  review_reasons: Reason[];
  classification: Classification;
  sources: Source[];
  history: HistoryEntry[];
  manifest: CodeManifest | null;
  notes: string;
  pages: number;
  words: number;
  rendition: string | null;
  pages_needing_transcription: number;
}

export interface InstitutionRow {
  slug: string;
  name: string;
  acronym: string | null;
}

export interface CourseRow {
  key: string;
  institution: string;
  slug: string;
  name: string;
  degree: string | null;
}

export interface UnitRow {
  key: string;
  institution: string;
  slug: string;
  code: string | null;
  name: string;
  acronym: string | null;
  ects: number | null;
  lecturers: string[];
}

export interface CourseUnitRow {
  course_key: string;
  unit_key: string;
  curricular_year: number | null;
  semester: number | null;
}

export type VocabKind =
  | "document_types"
  | "roles"
  | "solution_origins"
  | "assessment_types"
  | "exam_seasons";

export interface VocabTerm {
  kind: VocabKind;
  slug: string;
  label: string;
  labels: Record<string, string>;
  role: string;
  is_assessment: boolean;
  is_submission: boolean;
  is_syllabus: boolean;
  is_fallback: boolean;
  sort: number;
}

export interface Evidence {
  document: string;
  sha256: string;
  page?: number;
  snippet: string;
}

export interface ProposalRow {
  id: string;
  kind: "institution" | "course" | "unit";
  status: "open" | "accepted" | "rejected";
  name: string;
  data: Record<string, unknown>;
  evidence: Evidence[];
  created_at: string | null;
}

export interface UserRow {
  login: string;
  name: string | null;
  preferences: { locale?: string; tutor_mode?: boolean };
  enrollments: { courses?: string[]; units?: { unit: string; academic_year?: string }[] };
}

export interface NearDuplicate {
  other: string;
  distance: number;
  score: number;
}

export interface SearchFilters {
  unit?: string;
  course?: string;
  document_type?: string;
  academic_year?: string;
}

export interface SearchHit {
  doc_id: string;
  sha256: string;
  page: number;
  title: string;
  snippet: string;
  unit: string | null;
  document_type: string | null;
  academic_year: string | null;
  score: number;
}

export interface IndexManifest {
  schema_version: number;
  search_schema_version: number;
  built_at: string;
  built_from: string | null;
  files: Record<string, { size: number; sha256: string }>;
}

// Estrutura de uma UC no formato de importação `nexus-catalogo`.
export interface CatalogUnitInput {
  slug: string;
  name: string;
  code?: string;
  acronym?: string;
  ects?: number;
  lecturers?: string[];
}

export interface CatalogBundle {
  format: "nexus-catalogo";
  version: 1;
  institutions?: {
    slug: string;
    name: string;
    acronym?: string;
    courses?: {
      slug: string;
      name: string;
      degree?: string;
      units: { unit: string; curricular_year?: number; semester?: number }[];
    }[];
    units?: CatalogUnitInput[];
  }[];
  proposals?: { accept?: string[]; reject?: string[] };
}
