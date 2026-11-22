// Cor de cada tipo de documento: o nome da paleta vem do vocabulário (`color`, só
// apresentação); sem ele, uma cor estável escolhida pelo slug. Nada de slugs no código.

import type { VocabTerm } from "../data/types";

export const TYPE_PALETTE = [
  "terracotta",
  "ochre",
  "green",
  "green-dark",
  "brick",
  "brick-dark",
  "teal",
  "teal-dark",
  "blue",
  "violet",
  "slate",
  "umber",
  "grey",
] as const;

const NEUTRAL = "var(--color-line-strong)";

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

/** A cor (valor CSS) do tipo `slug`; neutra sem tipo. */
export function typeColor(types: readonly VocabTerm[], slug: string | null | undefined): string {
  if (!slug) return NEUTRAL;
  const named = types.find((t) => t.slug === slug)?.color;
  const name =
    named && (TYPE_PALETTE as readonly string[]).includes(named)
      ? named
      : TYPE_PALETTE[hash(slug) % TYPE_PALETTE.length];
  return `var(--color-type-${name})`;
}
