// Listas de sugestões para quando se regista uma instituição, um curso ou uma cadeira:
// primeiro o que já está no catálogo, depois o que o material propôs, por fim a lista de
// referência (data/reference/pt.json). São só sugestões: escreve-se o que se quiser.

import reference from "../data/reference/pt.json";
import type { MetaIndex } from "../data/sqlite/queries";
import { normalize } from "./normalize";

export interface Suggestion {
  value: string;
  /** Texto de apoio (sigla, instituição, "proposto pelo material"...). */
  hint?: string;
  acronym?: string;
}

export const DEGREES = reference.degrees;

function unique(items: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = normalize(s.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function institutionSuggestions(meta: MetaIndex | null): Suggestion[] {
  const known = (meta?.institutions() ?? []).map((i) => ({
    value: i.name,
    ...(i.acronym ? { acronym: i.acronym, hint: i.acronym } : {}),
  }));
  const proposed = (meta?.proposals() ?? [])
    .filter((p) => p.kind === "institution")
    .map((p) => ({ value: p.name }));
  const listed = reference.institutions.map((i) => ({
    value: i.name,
    acronym: i.acronym,
    hint: i.acronym,
  }));
  return unique([...known, ...proposed, ...listed]);
}

export function courseSuggestions(meta: MetaIndex | null, degree?: string): Suggestion[] {
  const known = (meta?.courses() ?? []).map((c) => ({ value: c.name }));
  const proposed = (meta?.proposals() ?? [])
    .filter((p) => p.kind === "course")
    .map((p) => ({ value: p.name }));
  const prefix = reference.degrees.find((d) => d.slug === degree)?.prefix ?? "Licenciatura em";
  const listed = reference.courses.map((name) => ({ value: `${prefix} ${name}` }));
  return unique([...known, ...proposed, ...listed]);
}

export function unitSuggestions(meta: MetaIndex | null): Suggestion[] {
  const known = (meta?.units() ?? []).map((u) => ({
    value: u.name,
    ...(u.acronym ? { acronym: u.acronym, hint: u.acronym } : {}),
  }));
  const proposed = (meta?.proposals() ?? [])
    .filter((p) => p.kind === "unit")
    .map((p) => ({
      value: p.name,
      ...(typeof p.data.acronym === "string" ? { acronym: p.data.acronym } : {}),
    }));
  return unique([...known, ...proposed]);
}

/** A sugestão que corresponde ao que foi escrito (para preencher a sigla, por exemplo). */
export function findSuggestion(list: Suggestion[], value: string): Suggestion | undefined {
  const key = normalize(value);
  return key ? list.find((s) => normalize(s.value) === key) : undefined;
}
