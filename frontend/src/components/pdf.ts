// Abrir PDFs com o pdf.js. Os grandes guardados no R2 (ou no material público) abrem por
// partes: só se trazem os bytes das páginas que se vêem, em vez de esperar pelo ficheiro
// inteiro (um livro digitalizado de 90 MB ficava minutos em «A carregar…»).

import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useApp } from "../data/context";
import type { DataSource } from "../data/source";
import type { DocumentRow } from "../data/types";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfDocument = pdfjs.PDFDocumentProxy;
export type PdfPage = pdfjs.PDFPageProxy;

/** A partir daqui tenta-se abrir por partes. */
export const RANGE_MIN_BYTES = 4 * 1024 * 1024;
export const RANGE_CHUNK_BYTES = 512 * 1024;

/** O PDF que se mostra: o original, ou a versão PDF de um ficheiro Office. */
export function pdfPath(doc: DocumentRow): string | null {
  return doc.ext === "pdf" ? doc.original_path : doc.rendition;
}

export async function openPdf(
  source: DataSource,
  path: string,
  size: number | null,
): Promise<PdfDocument> {
  if (size && size >= RANGE_MIN_BYTES && source.binaryRange) {
    const read = source.binaryRange.bind(source);
    const first = await read(path, 0, Math.min(size, RANGE_CHUNK_BYTES)).catch(() => null);
    if (first) {
      const transport = new pdfjs.PDFDataRangeTransport(size, first);
      transport.requestDataRange = (begin: number, end: number) => {
        void read(path, begin, end).then(
          (chunk) => transport.onDataRange(begin, chunk),
          () => undefined, // a página fica por mostrar; ao voltar a ela, pede-se outra vez
        );
      };
      return pdfjs.getDocument({
        range: transport,
        rangeChunkSize: RANGE_CHUNK_BYTES,
        disableAutoFetch: true,
        disableStream: true,
      }).promise;
    }
  }
  const data = await source.binary(path);
  return pdfjs.getDocument({ data }).promise;
}

const watched = new WeakSet<QueryClient>();

/** Os documentos abertos ocupam memória no worker do pdf.js: fecham-se quando saem da cache. */
function closeOnRemoval(client: QueryClient) {
  if (watched.has(client)) return;
  watched.add(client);
  client.getQueryCache().subscribe((event) => {
    if (event.type === "removed" && event.query.queryKey[0] === "pdf") {
      void (event.query.state.data as PdfDocument | undefined)?.loadingTask.destroy();
    }
  });
}

/** O PDF do documento, partilhado pela página do documento e pelo modo de leitura. */
export function usePdf(doc: DocumentRow | undefined) {
  const { source } = useApp();
  const client = useQueryClient();
  closeOnRemoval(client);
  const path = doc ? pdfPath(doc) : null;
  return useQuery({
    queryKey: ["pdf", source.repo, path],
    enabled: Boolean(path),
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
    queryFn: () => openPdf(source, path!, doc?.ext === "pdf" ? doc.size : null),
  });
}

/** Tamanho de uma página (pontos PDF), já com a rotação própria da página. */
export async function pageSize(pdf: PdfDocument, number: number) {
  const page = await pdf.getPage(number);
  const viewport = page.getViewport({ scale: 1 });
  return { width: viewport.width, height: viewport.height };
}

// O canvas tem um limite de píxeis (cerca de 16 milhões no Safari): acima, fica em branco.
const MAX_CANVAS_PIXELS = 16_000_000;

/**
 * Desenha uma página num canvas com a largura pedida (píxeis CSS), com a densidade do ecrã.
 * Devolve uma função para cancelar.
 */
export function renderPage(
  pdf: PdfDocument,
  number: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  rotation: number,
  onError: (error: unknown) => void,
): () => void {
  let cancelled = false;
  let cancelRendering: (() => void) | undefined;
  void pdf
    .getPage(number)
    .then((page) => {
      if (cancelled) return;
      const turn = (page.rotate + rotation) % 360;
      const base = page.getViewport({ scale: 1, rotation: turn });
      const scale = cssWidth / base.width;
      let ratio = window.devicePixelRatio || 1;
      const pixels = base.width * scale * ratio * (base.height * scale * ratio);
      if (pixels > MAX_CANVAS_PIXELS) ratio *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
      const viewport = page.getViewport({ scale, rotation: turn });
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      // A densidade do ecrã vai só no `transform` do pdf.js. Aplicá-la também ao contexto
      // (setTransform) multiplicava-a duas vezes: a página ficava maior do que o canvas
      // e era cortada (ex.: a 125%, ficava 56% maior).
      const task = page.render({
        canvasContext: context,
        viewport,
        canvas,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      cancelRendering = () => task.cancel();
      void task.promise.catch((err: unknown) => {
        if (!cancelled && !(err instanceof Error && err.name === "RenderingCancelledException"))
          onError(err);
      });
    })
    .catch((err: unknown) => {
      if (!cancelled) onError(err);
    });
  return () => {
    cancelled = true;
    cancelRendering?.();
  };
}

export interface OutlineEntry {
  title: string;
  page: number | null;
  items: OutlineEntry[];
}

/** O índice do PDF (marcadores), com a página de cada entrada. */
export async function pdfOutline(pdf: PdfDocument): Promise<OutlineEntry[]> {
  const outline = await pdf.getOutline();
  if (!outline) return [];
  type Node = (typeof outline)[number];
  const resolve = async (node: Node): Promise<OutlineEntry> => {
    let page: number | null = null;
    try {
      const dest = typeof node.dest === "string" ? await pdf.getDestination(node.dest) : node.dest;
      const ref = dest?.[0];
      if (typeof ref === "number") page = ref + 1;
      else if (ref && typeof ref === "object") page = (await pdf.getPageIndex(ref)) + 1;
    } catch {
      page = null;
    }
    return { title: node.title, page, items: await Promise.all(node.items.map(resolve)) };
  };
  return Promise.all(outline.map(resolve));
}
