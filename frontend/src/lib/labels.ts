// Rótulos legíveis para valores de classificação (UCs e vocabulários vêm do índice).

import { useMemo } from "react";
import type { MetaIndex } from "../data/sqlite/queries";
import type { ClassificationField, UnitRow, VocabKind, VocabTerm } from "../data/types";
import i18n from "../i18n";

export const FIELD_VOCAB: Partial<Record<ClassificationField, VocabKind>> = {
  document_type: "document_types",
  assessment_type: "assessment_types",
  exam_season: "exam_seasons",
  role: "roles",
  solution_origin: "solution_origins",
};

export interface Labels {
  units: UnitRow[];
  vocab: Record<VocabKind, VocabTerm[]>;
  unit: (key: string | null | undefined) => string;
  term: (kind: VocabKind, slug: string | null | undefined) => string;
  value: (field: ClassificationField, value: unknown) => string;
}

export function useLabels(meta: MetaIndex | null): Labels {
  return useMemo(() => {
    const units = meta?.units() ?? [];
    const kinds: VocabKind[] = [
      "document_types",
      "roles",
      "solution_origins",
      "assessment_types",
      "exam_seasons",
    ];
    const vocab = Object.fromEntries(kinds.map((k) => [k, meta?.vocab(k) ?? []])) as Record<
      VocabKind,
      VocabTerm[]
    >;
    const unitMap = new Map(units.map((u) => [u.key, u]));
    const unit = (key: string | null | undefined) => {
      if (!key) return i18n.t("common.none");
      const row = unitMap.get(key);
      return row ? (row.acronym ? `${row.name} (${row.acronym})` : row.name) : key;
    };
    const term = (kind: VocabKind, slug: string | null | undefined) =>
      slug ? (vocab[kind].find((t) => t.slug === slug)?.label ?? slug) : i18n.t("common.none");
    const value = (field: ClassificationField, raw: unknown) => {
      if (raw === null || raw === undefined || raw === "") return i18n.t("common.none");
      if (field === "unit") return unit(String(raw));
      const kind = FIELD_VOCAB[field];
      if (kind) return term(kind, String(raw));
      if (Array.isArray(raw)) return raw.join(", ");
      return String(raw);
    };
    return { units, vocab, unit, term, value };
  }, [meta]);
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return i18n.t("common.none");
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function academicYears(extra: string[] = []): string[] {
  const now = new Date();
  const current = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const years = new Set(extra);
  for (let y = current + 1; y >= current - 15; y--) years.add(`${y}-${y + 1}`);
  return [...years].sort().reverse();
}
