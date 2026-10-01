// Cor de cada curso: a cor tradicional da área (fitas da Universidade de Coimbra, por
// faculdade), da lista de referência data/reference/pt.json. Cursos com a mesma cor recebem
// tons diferentes, para se distinguirem; sem correspondência, uma cor estável pelo nome.

import { unitColor } from "../components/ui";
import reference from "../data/reference/pt.json";
import type { CourseRow } from "../data/types";
import { normalize } from "./normalize";

export interface CourseColor {
  color: string;
  /** Segunda cor da fita (ex.: Economia, vermelho e branco). */
  secondary?: string;
  /** Nome da cor tradicional, para o tooltip. */
  label?: string;
}

const rules = reference.course_colors.map((r) => ({
  ...r,
  keywords: r.keywords.map((k) => normalize(k)),
}));

function baseColor(name: string): CourseColor | null {
  const text = ` ${normalize(name)} `;
  const rule = rules.find((r) => r.keywords.some((k) => text.includes(k)));
  if (!rule) return null;
  return {
    color: rule.color,
    ...("secondary" in rule && rule.secondary ? { secondary: String(rule.secondary) } : {}),
    label: rule.name,
  };
}

/** Mistura `hex` com preto (amount < 0) ou branco (amount > 0). */
function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const mix = (c: number) => Math.round(c + (target - c) * Math.abs(amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const STEPS = [0, -0.28, 0.3, -0.48, 0.5];

/** Cores de todos os cursos (os que partilham a cor da área ficam com tons diferentes). */
export function courseColors(courses: Pick<CourseRow, "key" | "name">[]): Map<string, CourseColor> {
  const out = new Map<string, CourseColor>();
  const seen = new Map<string, number>();
  for (const course of [...courses].sort((a, b) => a.key.localeCompare(b.key))) {
    const base = baseColor(course.name);
    if (!base) {
      out.set(course.key, { color: unitColor(course.key) });
      continue;
    }
    const index = seen.get(base.color) ?? 0;
    seen.set(base.color, index + 1);
    out.set(course.key, { ...base, color: shade(base.color, STEPS[index % STEPS.length]!) });
  }
  return out;
}
