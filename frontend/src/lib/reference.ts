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

const DEGREE_PREFIX =
  /^\s*(licenciatura|mestrado(\s+integrado)?|doutoramento|ctesp|curso\s+t[eé]cnico\s+superior\s+profissional|p[oó]s-?\s?gradua[cç][aã]o)\s+(em|de)\s+/i;

/** Nome do curso sem o grau ("Licenciatura em Engenharia Informática" → "Engenharia
 * Informática"); o grau fica no campo `degree`. */
export function courseTitle(name: string): string {
  return name.replace(DEGREE_PREFIX, "").trim() || name;
}

/** Grau pelo início do nome ("Mestrado Integrado em …" → mestrado-integrado). */
export function degreeOf(name: string): string | null {
  const match = name.match(DEGREE_PREFIX);
  if (!match) return null;
  const word = normalize(match[1] ?? "");
  if (word.startsWith("mestrado integrado")) return "mestrado-integrado";
  if (word.startsWith("curso tecnico") || word === "ctesp") return "ctesp";
  if (word.startsWith("pos")) return "pos-graduacao";
  return word.split(" ")[0] ?? null;
}

export function courseSuggestions(meta: MetaIndex | null, _degree?: string): Suggestion[] {
  const known = (meta?.courses() ?? []).map((c) => ({ value: courseTitle(c.name) }));
  const proposed = (meta?.proposals() ?? [])
    .filter((p) => p.kind === "course")
    .map((p) => ({ value: courseTitle(p.name) }));
  const listed = reference.courses.map((name) => ({ value: name }));
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
