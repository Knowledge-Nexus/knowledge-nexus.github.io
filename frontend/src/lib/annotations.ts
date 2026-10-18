// Marcas de leitura (marcador, sublinhado, caneta) feitas no modo de leitura.
//
// São de cada pessoa: ficam num ficheiro por documento (`anotacoes/<pessoa>/<id>.json` no
// repositório de dados; no material público, só no browser) e nunca alteram o original.
// As coordenadas são da página sem a rotação pedida no leitor: a largura vale `PAGE_UNITS` e
// a altura segue a proporção da página, por isso as marcas acompanham o zoom e a rotação.

export const PAGE_UNITS = 10000;

export const MARK_COLORS = ["yellow", "green", "blue", "pink", "red", "ink"] as const;
export type MarkColor = (typeof MARK_COLORS)[number];

export type StrokeKind = "highlight" | "underline" | "pen";

export interface Stroke {
  id: string;
  kind: StrokeKind;
  color: MarkColor;
  /** Espessura, em unidades da página. */
  width: number;
  /** x0, y0, x1, y1, … (inteiros, unidades da página). */
  points: number[];
}

/** Página (1, 2, …) → traços, pela ordem em que foram feitos. */
export type PageMarks = Record<string, Stroke[]>;

export interface AnnotationFile {
  format: "nexus-anotacoes";
  version: 1;
  document: string;
  sha256: string;
  updated_at: string;
  pages: PageMarks;
}

export const STROKE_SIZES = { thin: 0.6, medium: 1, thick: 1.7 } as const;
export type StrokeSize = keyof typeof STROKE_SIZES;

const BASE_WIDTH: Record<StrokeKind, number> = { highlight: 210, underline: 24, pen: 18 };

export function strokeWidth(kind: StrokeKind, size: StrokeSize): number {
  return Math.round(BASE_WIDTH[kind] * STROKE_SIZES[size]);
}

export function newStrokeId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function emptyAnnotations(document: string, sha256: string): AnnotationFile {
  return {
    format: "nexus-anotacoes",
    version: 1,
    document,
    sha256,
    updated_at: new Date(0).toISOString(),
    pages: {},
  };
}

const KINDS = new Set<string>(["highlight", "underline", "pen"]);
const COLORS = new Set<string>(MARK_COLORS);

function validStroke(value: unknown): value is Stroke {
  const s = value as Stroke;
  return (
    typeof s === "object" &&
    s !== null &&
    typeof s.id === "string" &&
    KINDS.has(s.kind) &&
    COLORS.has(s.color) &&
    typeof s.width === "number" &&
    Array.isArray(s.points) &&
    s.points.length >= 2 &&
    s.points.length % 2 === 0 &&
    s.points.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

/** Lê um ficheiro de marcas; os traços que não se percebem ficam de fora. */
export function parseAnnotations(text: string | null): AnnotationFile | null {
  if (!text) return null;
  let data: Partial<AnnotationFile>;
  try {
    data = JSON.parse(text) as Partial<AnnotationFile>;
  } catch {
    return null;
  }
  if (data?.format !== "nexus-anotacoes" || typeof data.document !== "string") return null;
  const pages: PageMarks = {};
  for (const [page, strokes] of Object.entries(data.pages ?? {})) {
    if (!/^\d+$/.test(page) || !Array.isArray(strokes)) continue;
    const kept = strokes.filter(validStroke);
    if (kept.length) pages[page] = kept;
  }
  return {
    format: "nexus-anotacoes",
    version: 1,
    document: data.document,
    sha256: String(data.sha256 ?? ""),
    updated_at: String(data.updated_at ?? new Date(0).toISOString()),
    pages,
  };
}

/** Um traço por linha: diffs legíveis no repositório e ficheiros pequenos. */
export function stringifyAnnotations(file: AnnotationFile): string {
  const pages = Object.keys(file.pages)
    .filter((p) => file.pages[p]?.length)
    .sort((a, b) => Number(a) - Number(b));
  const body = pages
    .map(
      (p) =>
        `    "${p}": [\n${file.pages[p]!.map((s) => `      ${JSON.stringify(s)}`).join(",\n")}\n    ]`,
    )
    .join(",\n");
  const head = JSON.stringify({
    format: file.format,
    version: file.version,
    document: file.document,
    sha256: file.sha256,
    updated_at: file.updated_at,
  }).slice(0, -1);
  return `${head},\n  "pages": {${body ? `\n${body}\n  ` : ""}}\n}\n`;
}

/** Marcas guardadas só neste browser (visitantes e acessos «só ver e descarregar»). */
export function readLocalAnnotations(key: string): AnnotationFile | null {
  try {
    return parseAnnotations(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function writeLocalAnnotations(key: string, file: AnnotationFile): void {
  localStorage.setItem(key, stringifyAnnotations(file));
}

export function markCount(pages: PageMarks): number {
  return Object.values(pages).reduce((sum, list) => sum + list.length, 0);
}

/** As páginas com marcas, por ordem, com o número de traços de cada uma. */
export function markedPages(pages: PageMarks): { page: number; count: number }[] {
  return Object.entries(pages)
    .filter(([, list]) => list.length > 0)
    .map(([page, list]) => ({ page: Number(page), count: list.length }))
    .sort((a, b) => a.page - b.page);
}

// Rotação do leitor (0, 90, 180 ou 270 graus, no sentido dos ponteiros do relógio).

/** Tamanho da caixa visível (viewBox) para uma página W×H com a rotação pedida. */
export function rotatedBox(rotation: number, width: number, height: number): [number, number] {
  return rotation % 180 === 0 ? [width, height] : [height, width];
}

/** Transformação SVG das coordenadas da página para a caixa visível. */
export function rotationTransform(rotation: number, width: number, height: number): string {
  switch (rotation) {
    case 90:
      return `translate(${height} 0) rotate(90)`;
    case 180:
      return `translate(${width} ${height}) rotate(180)`;
    case 270:
      return `translate(0 ${width}) rotate(270)`;
    default:
      return "";
  }
}

/** Ponto na caixa visível → coordenadas da página (o inverso de `rotationTransform`). */
export function toPage(
  dx: number,
  dy: number,
  rotation: number,
  width: number,
  height: number,
): [number, number] {
  switch (rotation) {
    case 90:
      return [dy, height - dx];
    case 180:
      return [width - dx, height - dy];
    case 270:
      return [width - dy, dx];
    default:
      return [dx, dy];
  }
}

/**
 * Marcador e sublinhado são segmentos rectos; quase na horizontal (em relação ao que se vê,
 * que pode estar rodado), ficam na horizontal, como as linhas do texto.
 */
export function straighten(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rotation = 0,
  maxDegrees = 10,
): [number, number] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const vertical = rotation % 180 !== 0; // as linhas do texto ficam na vertical da página
  const along = vertical ? Math.abs(dy) : Math.abs(dx);
  const across = vertical ? Math.abs(dx) : Math.abs(dy);
  if (along === 0) return [x1, y1];
  if ((Math.atan(across / along) * 180) / Math.PI > maxDegrees) return [x1, y1];
  return vertical ? [x0, y1] : [x1, y0];
}

/** Junta os pontos de um traço à mão demasiado próximos (ficheiros mais pequenos). */
export function simplify(points: number[], tolerance: number): number[] {
  if (points.length <= 4) return points.map(Math.round);
  const out = [Math.round(points[0]!), Math.round(points[1]!)];
  let lastX = points[0]!;
  let lastY = points[1]!;
  for (let i = 2; i < points.length - 2; i += 2) {
    const x = points[i]!;
    const y = points[i + 1]!;
    if (Math.hypot(x - lastX, y - lastY) >= tolerance) {
      out.push(Math.round(x), Math.round(y));
      lastX = x;
      lastY = y;
    }
  }
  out.push(Math.round(points[points.length - 2]!), Math.round(points[points.length - 1]!));
  return out;
}

function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** A borracha (círculo de raio `radius` em x, y) toca no traço. */
export function hitsStroke(stroke: Stroke, x: number, y: number, radius: number): boolean {
  const reach = radius + stroke.width / 2;
  const p = stroke.points;
  if (p.length === 2) return Math.hypot(x - p[0]!, y - p[1]!) <= reach;
  for (let i = 0; i + 3 < p.length; i += 2) {
    if (segmentDistance(x, y, p[i]!, p[i + 1]!, p[i + 2]!, p[i + 3]!) <= reach) return true;
  }
  return false;
}

/** Caminho SVG do traço. */
export function strokePath(points: number[]): string {
  if (points.length < 2) return "";
  const parts = [`M${points[0]} ${points[1]}`];
  for (let i = 2; i + 1 < points.length; i += 2) parts.push(`L${points[i]} ${points[i + 1]}`);
  // Um toque só (um ponto) também se vê.
  if (points.length === 2) parts.push(`L${points[0]! + 0.01} ${points[1]}`);
  return parts.join("");
}

// Desfazer e refazer: cada passo guarda o estado inteiro (as marcas são pequenas).

export const HISTORY_LIMIT = 100;

export interface MarkHistory {
  past: PageMarks[];
  present: PageMarks;
  future: PageMarks[];
}

export function startHistory(present: PageMarks): MarkHistory {
  return { past: [], present, future: [] };
}

export function pushHistory(history: MarkHistory, next: PageMarks): MarkHistory {
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

export function undoHistory(history: MarkHistory): MarkHistory {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory(history: MarkHistory): MarkHistory {
  const [next, ...rest] = history.future;
  if (!next) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}

export function withPage(pages: PageMarks, page: number, strokes: Stroke[]): PageMarks {
  const next = { ...pages };
  if (strokes.length) next[String(page)] = strokes;
  else delete next[String(page)];
  return next;
}
