// Ordem dos documentos dentro de uma cadeira: por ano lectivo (o mais recente primeiro) e,
// dentro de cada ano, pela ordem natural ("FT 2" antes de "FT 10", "Teste 1" antes do 2).

import type { DocumentRow } from "../data/types";

/** Compara textos com os números pela ordem natural, sem ligar a maiúsculas e acentos. */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, "pt", { numeric: true, sensitivity: "base" });
}

/** Dentro de um ano: provas pela data e pelo número; o resto pelo título. */
export function compareInYear(
  a: DocumentRow,
  b: DocumentRow,
  title: (doc: DocumentRow) => string,
): number {
  const date = (d: DocumentRow) => String(d.classification.date?.value ?? "");
  const dateA = date(a);
  const dateB = date(b);
  if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
  const numA = a.assessment_number ?? 0;
  const numB = b.assessment_number ?? 0;
  if (a.assessment_type && a.assessment_type === b.assessment_type && numA !== numB)
    return numA - numB;
  return naturalCompare(title(a), title(b)) || naturalCompare(a.display_name, b.display_name);
}

export interface YearGroup {
  /** "2020-2021", ou null para os documentos sem ano lectivo. */
  year: string | null;
  docs: DocumentRow[];
}

export function groupByYear(docs: DocumentRow[], title: (doc: DocumentRow) => string): YearGroup[] {
  const groups = new Map<string | null, DocumentRow[]>();
  for (const doc of docs) {
    const key = doc.academic_year ?? null;
    groups.set(key, [...(groups.get(key) ?? []), doc]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b.localeCompare(a)))
    .map(([year, list]) => ({ year, docs: list.sort((x, y) => compareInYear(x, y, title)) }));
}

/** "2020-2021" → "2020/2021". */
export function yearLabel(year: string): string {
  return year.replace("-", "/");
}
