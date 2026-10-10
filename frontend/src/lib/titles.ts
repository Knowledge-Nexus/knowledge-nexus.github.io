// Título legível de um documento nas listas, a partir da classificação: "Frequência 1 ·
// versão A". A data e o nome do ficheiro ficam na linha secundária.

import type { DocumentRow } from "../data/types";
import i18n from "../i18n";
import type { Labels } from "./labels";

/** "FT 0 REVISÕES de CÁLCULO" → "FT 0 Revisões de Cálculo": as palavras em maiúsculas com 5
 * letras ou mais ficam só com a inicial; as siglas curtas (FT, LEI, TPC) ficam. */
export function soften(text: string): string {
  return text.replace(/\p{Lu}{5,}/gu, (word, offset: number, whole: string) => {
    const before = whole[offset - 1] ?? " ";
    const after = whole[offset + word.length] ?? " ";
    // Só palavras inteiras: "MATIILEI1920" ou "MatII" ficam como estão.
    if (/[\p{L}\d]/u.test(before) || /[\p{L}\d]/u.test(after)) return word;
    return word[0] + word.slice(1).toLocaleLowerCase("pt");
  });
}

function prettify(stem: string): string {
  const text = stem
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/([a-zà-ÿ]{3,})(\d)/gi, "$1 $2")
    .replace(/(\d)([a-zà-ÿ])/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const soft = soften(text);
  return soft ? soft[0]!.toUpperCase() + soft.slice(1) : stem;
}

export function originalName(doc: DocumentRow): string {
  return doc.source_path?.split("!/").pop()?.split("/").pop() ?? doc.display_name;
}

/**
 * `withType`: incluir o tipo (quando a lista não está já agrupada por tipo).
 */
export function documentTitle(doc: DocumentRow, labels: Labels, withType = false): string {
  const c = doc.classification;
  const parts: string[] = [];
  const type = doc.document_type ? labels.term("document_types", doc.document_type) : null;
  if (doc.assessment_type) {
    const assessment = labels.term("assessment_types", doc.assessment_type);
    parts.push(doc.assessment_number ? `${assessment} ${doc.assessment_number}` : assessment);
    if (c.exam_season?.value) parts.push(labels.term("exam_seasons", String(c.exam_season.value)));
    if (c.variant?.value) parts.push(i18n.t("library.variant", { value: c.variant.value }));
    if (withType && doc.role) parts.push(labels.term("roles", doc.role));
    return parts.join(" · ");
  }
  const name = prettify(originalName(doc));
  return withType && type ? `${type} · ${name}` : name;
}

/** Data da prova, já formatada (ou null). */
export function documentDate(doc: DocumentRow, labels: Labels): string | null {
  const value = doc.classification.date?.value;
  return value ? labels.value("date", value) : null;
}
