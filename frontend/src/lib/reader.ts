// Modo de leitura: páginas à vista (uma, ou duas lado a lado como num livro aberto), as
// preferências de quem lê e a última página lida de cada documento (só neste browser).

import type { MarkColor, StrokeSize } from "./annotations";

/**
 * As páginas à vista. Como livro, a 1.ª página (capa) fica sozinha e depois vêm aos pares:
 * 2–3, 4–5… (as pares à esquerda, como num livro impresso).
 */
export function spreadPages(page: number, total: number, spread: boolean): number[] {
  const current = Math.min(Math.max(1, page), Math.max(1, total));
  if (!spread || current <= 1) return [current];
  const left = current % 2 === 0 ? current : current - 1;
  return left + 1 <= total ? [left, left + 1] : [left];
}

export function nextPage(page: number, total: number, spread: boolean): number {
  const pages = spreadPages(page, total, spread);
  return Math.min(total, pages[pages.length - 1]! + 1);
}

export function previousPage(page: number, total: number, spread: boolean): number {
  const first = spreadPages(page, total, spread)[0]!;
  if (first <= 1) return 1;
  return spreadPages(first - 1, total, spread)[0]!;
}

export type Tone = "paper" | "sepia" | "night";
export type Fit = "page" | "width";

export interface ReaderPrefs {
  /** null: decide pela largura do ecrã. */
  spread: boolean | null;
  fit: Fit;
  tone: Tone;
  color: MarkColor;
  size: StrokeSize;
}

const PREFS_KEY = "nexus.leitor";
const DEFAULT_PREFS: ReaderPrefs = {
  spread: null,
  fit: "page",
  tone: "paper",
  color: "yellow",
  size: "medium",
};

export function loadPrefs(): ReaderPrefs {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Partial<ReaderPrefs>;
    return { ...DEFAULT_PREFS, ...stored };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: ReaderPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // sem armazenamento: as preferências valem só agora
  }
}

const pageKey = (docId: string) => `nexus.leitura.${docId}`;

/** A última página lida (null se nunca se abriu ou se foi a 1.ª). */
export function lastPage(docId: string): number | null {
  try {
    const value = Number(localStorage.getItem(pageKey(docId)));
    return Number.isInteger(value) && value > 1 ? value : null;
  } catch {
    return null;
  }
}

export function rememberPage(docId: string, page: number): void {
  try {
    if (page > 1) localStorage.setItem(pageKey(docId), String(page));
    else localStorage.removeItem(pageKey(docId));
  } catch {
    // sem armazenamento
  }
}

/** Filtro CSS do tom da página (as marcas ficam por cima, sem filtro). */
export const TONE_FILTER: Record<Tone, string | undefined> = {
  paper: undefined,
  sepia: "sepia(0.45) saturate(1.15) brightness(0.96)",
  night: "invert(0.92) hue-rotate(180deg) brightness(0.92)",
};
