// Mesma normalização que backend/nexus/domain/text.py (vectores partilhados em
// tests/contrato/normalizacao.json). Usada para construir as consultas de pesquisa.

const CAMEL = /(?<=[a-z])(?=[A-Z])/g;
const NON_ALNUM = /[^a-z0-9]+/g;
const LETTER_DIGIT = /(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/g;
const SPELLING_RULES: [string, string][] = [
  ["cc", "c"],
  ["ct", "t"],
  ["pc", "c"],
  ["pt", "t"],
];

export function stripAccents(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "");
}

export function normalize(text: string): string {
  let value = stripAccents(text.replace(CAMEL, " ")).toLowerCase().replace(NON_ALNUM, " ");
  value = value.replace(LETTER_DIGIT, " ");
  for (const [from, to] of SPELLING_RULES) {
    value = value.split(from).join(to);
  }
  return value.split(/\s+/).filter(Boolean).join(" ");
}

export function slugify(text: string, maxLength = 60): string {
  const value = stripAccents(text)
    .toLowerCase()
    .replace(NON_ALNUM, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return value.slice(0, maxLength).replace(/-+$/, "") || "sem-nome";
}
