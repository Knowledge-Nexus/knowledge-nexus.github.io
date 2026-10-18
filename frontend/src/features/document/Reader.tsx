// Modo de leitura: só o documento à vista, sobre fundo preto, como uma folha de papel (ou um
// livro aberto, duas páginas lado a lado). Tem marcador, sublinhado, caneta e borracha; as
// marcas são só de quem as faz (`useMarks`) e o original nunca muda: «Ver o original»
// esconde-as.

import { useQuery } from "@tanstack/react-query";
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { hasOriginalView, IMAGE_EXTS, useBinary } from "../../components/DocumentViewer";
import {
  IconBookOpen,
  IconChevronLeft,
  IconChevronRight,
  IconClearPage,
  IconClose,
  IconEraser,
  IconExpand,
  IconEye,
  IconFitPage,
  IconFitWidth,
  IconHand,
  IconHighlighter,
  IconList,
  IconMoon,
  IconPage,
  IconPen,
  IconRedo,
  IconRotate,
  IconText,
  IconTrash,
  IconUnderline,
  IconUndo,
} from "../../components/icons";
import { Markdown } from "../../components/Markdown";
import { MarksLayer, pageUnitsHeight } from "../../components/MarksLayer";
import {
  type OutlineEntry,
  type PdfDocument,
  pageSize,
  pdfOutline,
  renderPage,
  usePdf,
} from "../../components/pdf";
import { ErrorBox, Spinner } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow } from "../../data/types";
import {
  emptyAnnotations,
  hitsStroke,
  MARK_COLORS,
  type MarkColor,
  markedPages,
  newStrokeId,
  PAGE_UNITS,
  type PageMarks,
  rotatedBox,
  STROKE_SIZES,
  type Stroke,
  type StrokeKind,
  type StrokeSize,
  simplify,
  straighten,
  strokeWidth,
  toPage,
  withPage,
} from "../../lib/annotations";
import { formatBytes } from "../../lib/files";
import {
  type Fit,
  loadPrefs,
  nextPage,
  previousPage,
  rememberPage,
  savePrefs,
  spreadPages,
  TONE_FILTER,
  type Tone,
} from "../../lib/reader";
import { type LoadedMarks, type SaveState, useMarkEditor, useSavedMarks } from "./useMarks";

type Size = { width: number; height: number };
type Tool = "read" | StrokeKind | "eraser";

/** O que o leitor sabe desenhar: páginas de um PDF ou uma imagem (uma página). */
interface PageSource {
  total: number;
  size: (page: number) => Promise<Size>;
  draw: (
    page: number,
    canvas: HTMLCanvasElement,
    cssWidth: number,
    rotation: number,
    onError: (error: unknown) => void,
  ) => () => void;
  outline?: () => Promise<OutlineEntry[]>;
}

function pdfSource(pdf: PdfDocument): PageSource {
  return {
    total: pdf.numPages,
    size: (page) => pageSize(pdf, page),
    draw: (page, canvas, width, rotation, onError) =>
      renderPage(pdf, page, canvas, width, rotation, onError),
    outline: () => pdfOutline(pdf),
  };
}

function imageSource(image: ImageBitmap): PageSource {
  return {
    total: 1,
    size: async () => ({ width: image.width, height: image.height }),
    draw: (_page, canvas, cssWidth, rotation) => {
      const turned = rotation % 180 !== 0;
      const width = turned ? image.height : image.width;
      const height = turned ? image.width : image.height;
      const scale = cssWidth / width;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * scale * ratio);
      canvas.height = Math.floor(height * scale * ratio);
      canvas.style.width = `${width * scale}px`;
      canvas.style.height = `${height * scale}px`;
      const context = canvas.getContext("2d");
      if (context) {
        const s = scale * ratio;
        context.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
        context.rotate((rotation * Math.PI) / 180);
        context.drawImage(
          image,
          (-image.width * s) / 2,
          (-image.height * s) / 2,
          image.width * s,
          image.height * s,
        );
      }
      return () => undefined;
    },
  };
}

const ERASER_RADIUS = 140;
const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.35)" stroke="black" stroke-width="1.5"/></svg>',
)}") 12 12, cell`;

/** Uma página: o canvas, as marcas por cima e o desenho com o rato, o dedo ou a caneta. */
function ReaderPage(props: {
  source: PageSource;
  number: number;
  size: Size;
  cssWidth: number;
  rotation: number;
  tone: Tone;
  strokes: Stroke[];
  showMarks: boolean;
  tool: Tool;
  color: MarkColor;
  strokeSize: StrokeSize;
  onStrokes: (next: Stroke[]) => void;
  gutter?: "left" | "right";
}) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<unknown>(null);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [erased, setErased] = useState<ReadonlySet<string>>(new Set());
  const draftRef = useRef<Stroke | null>(null);
  const erasedRef = useRef<ReadonlySet<string>>(new Set());
  const pointer = useRef<number | null>(null);
  const { source, number, cssWidth, rotation } = props;
  const height = pageUnitsHeight(props.size);
  const turned = rotation % 180 !== 0;
  const cssHeight =
    cssWidth *
    (turned ? props.size.width / props.size.height : props.size.height / props.size.width);
  const drawing = props.tool !== "read" && props.showMarks;

  useEffect(() => {
    if (!canvas.current || cssWidth <= 0) return;
    setError(null);
    return source.draw(number, canvas.current, cssWidth, rotation, setError);
  }, [source, number, cssWidth, rotation]);

  const point = (event: { clientX: number; clientY: number }, rect: DOMRect): [number, number] => {
    const [vw, vh] = rotatedBox(rotation, PAGE_UNITS, height);
    const [x, y] = toPage(
      ((event.clientX - rect.left) / rect.width) * vw,
      ((event.clientY - rect.top) / rect.height) * vh,
      rotation,
      PAGE_UNITS,
      height,
    );
    return [Math.min(PAGE_UNITS, Math.max(0, x)), Math.min(height, Math.max(0, y))];
  };

  const erase = (x: number, y: number) => {
    const hit = props.strokes.filter(
      (s) => !erasedRef.current.has(s.id) && hitsStroke(s, x, y, ERASER_RADIUS),
    );
    if (!hit.length) return;
    erasedRef.current = new Set([...erasedRef.current, ...hit.map((s) => s.id)]);
    setErased(erasedRef.current);
  };

  const setDraftStroke = (stroke: Stroke | null) => {
    draftRef.current = stroke;
    setDraft(stroke);
  };

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drawing || event.button > 0 || pointer.current !== null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = event.pointerId;
    const [x, y] = point(event, event.currentTarget.getBoundingClientRect());
    if (props.tool === "eraser") {
      erase(x, y);
      return;
    }
    const kind = props.tool as StrokeKind;
    setDraftStroke({
      id: newStrokeId(),
      kind,
      color: props.color,
      width: strokeWidth(kind, props.strokeSize),
      points: [x, y],
    });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const points = (events.length ? events : [event.nativeEvent]).map((e) => point(e, rect));
    if (props.tool === "eraser") {
      for (const [x, y] of points) erase(x, y);
      return;
    }
    const current = draftRef.current;
    if (!current) return;
    if (current.kind === "pen") {
      setDraftStroke({ ...current, points: [...current.points, ...points.flat()] });
      return;
    }
    const [x0, y0] = current.points as [number, number];
    const [x1, y1] = points[points.length - 1]!;
    const [sx, sy] = event.shiftKey ? [x1, y1] : straighten(x0, y0, x1, y1, rotation);
    setDraftStroke({ ...current, points: [x0, y0, sx, sy] });
  }

  function finish(event: ReactPointerEvent<HTMLDivElement>, keep: boolean) {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    if (props.tool === "eraser") {
      const gone = erasedRef.current;
      erasedRef.current = new Set();
      setErased(erasedRef.current);
      if (keep && gone.size) props.onStrokes(props.strokes.filter((s) => !gone.has(s.id)));
      return;
    }
    const current = draftRef.current;
    setDraftStroke(null);
    if (!keep || !current) return;
    const points =
      current.kind === "pen" ? simplify(current.points, 8) : current.points.map(Math.round);
    // Um toque com o marcador ou o sublinhado (sem arrastar) não deixa marca.
    const length =
      points.length >= 4 ? Math.hypot(points[2]! - points[0]!, points[3]! - points[1]!) : 0;
    if (current.kind !== "pen" && length < 40) return;
    props.onStrokes([...props.strokes, { ...current, points }]);
  }

  const visible = erased.size ? props.strokes.filter((s) => !erased.has(s.id)) : props.strokes;
  const gutter = props.gutter ? `reader-gutter-${props.gutter}` : "";
  return (
    <div
      className={`reader-sheet relative shrink-0 ${gutter}`}
      style={{ width: cssWidth, height: cssHeight }}
      data-page={number}
    >
      <canvas
        ref={canvas}
        className="block"
        style={{ filter: TONE_FILTER[props.tone] }}
        aria-label={t("reader.page_label", { page: number })}
      />
      {props.showMarks && (
        <MarksLayer
          strokes={visible}
          draft={draft}
          height={height}
          rotation={rotation}
          night={props.tone === "night"}
        />
      )}
      {drawing && (
        <div
          className="absolute inset-0"
          style={{
            touchAction: "none",
            cursor: props.tool === "eraser" ? ERASER_CURSOR : "crosshair",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finish(e, true)}
          onPointerCancel={(e) => finish(e, false)}
        />
      )}
      {error ? (
        <div className="absolute inset-x-4 top-4">
          <ErrorBox error={error} />
        </div>
      ) : null}
    </div>
  );
}

/** O texto extraído da página, numa folha (documentos sem original para ver, ou a pedido). */
function ReaderText(props: { doc: DocumentRow; page: number; tone: Tone }) {
  const { t } = useTranslation();
  const { source } = useApp();
  const text = useQuery({
    queryKey: ["page", props.doc.sha256, props.page],
    queryFn: () => source.pageText(props.doc.sha256, props.page),
    retry: false,
  });
  const tone =
    props.tone === "night"
      ? "bg-[#1b1d22] text-[#d9d4c7]"
      : props.tone === "sepia"
        ? "bg-[#f3e7cf] text-[#3b2f20]"
        : "bg-white text-ink";
  return (
    <article
      className={`reader-sheet mx-auto min-h-full w-full max-w-3xl px-6 py-8 font-serif text-[1.05rem] leading-relaxed sm:px-12 sm:py-12 ${tone}`}
    >
      {text.isLoading && <Spinner />}
      {text.data?.trim() ? (
        <Markdown>{text.data}</Markdown>
      ) : (
        !text.isLoading && <p className="text-muted">{t("document.no_text")}</p>
      )}
    </article>
  );
}

function OutlineList(props: { items: OutlineEntry[]; onGo: (page: number) => void }) {
  return (
    <ul className="space-y-0.5 pl-3 first:pl-0">
      {props.items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: o índice do PDF não muda e não tem ids (os títulos repetem-se)
        <li key={index}>
          <button
            type="button"
            disabled={item.page === null}
            onClick={() => item.page !== null && props.onGo(item.page)}
            className="flex w-full items-baseline justify-between gap-3 rounded px-2 py-1 text-left text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <span>{item.title}</span>
            {item.page !== null && <span className="text-xs text-white/50">{item.page}</span>}
          </button>
          {item.items.length > 0 && <OutlineList items={item.items} onGo={props.onGo} />}
        </li>
      ))}
    </ul>
  );
}

function ChromeButton(props: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      aria-pressed={props.active}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:opacity-35 ${
        props.active
          ? "bg-gold/25 text-gold-light"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {props.children}
    </button>
  );
}

/** Separador; `vertical`: na coluna de ferramentas dos ecrãs largos fica na horizontal. */
const Separator = (props: { vertical?: boolean }) => (
  <span
    className={`mx-1 h-6 w-px shrink-0 bg-white/15 ${props.vertical ? "md:mx-0 md:my-1 md:h-px md:w-6" : ""}`}
    aria-hidden="true"
  />
);

const TONES: Tone[] = ["paper", "sepia", "night"];

function saveLabel(state: SaveState, readOnly: boolean): string {
  if (state === "saved") return readOnly ? "reader.state_local" : "reader.state_saved";
  return `reader.state_${state}`;
}

/** O leitor, já com o documento e as marcas carregados. */
function ReaderView(props: {
  doc: DocumentRow;
  title: string;
  source: PageSource | null;
  loaded: LoadedMarks;
  marksFailed: boolean;
  page: number;
  onPage: (page: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { readOnly } = useApp();
  const { doc, source } = props;
  const editor = useMarkEditor(doc, props.loaded);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [box, setBox] = useState<Size>({ width: 0, height: 0 });
  const total = source?.total ?? Math.max(doc.pages, 1);
  const [page, setPage] = useState(() => Math.min(Math.max(1, props.page), total));
  const [turn, setTurn] = useState<"next" | "prev" | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [tool, setTool] = useState<Tool>("read");
  const [showMarks, setShowMarks] = useState(true);
  const [textView, setTextView] = useState(!source);
  const [panel, setPanel] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [picker, setPicker] = useState(false);
  const [idle, setIdle] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sizes, setSizes] = useState<Record<number, Size>>({});
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const wide = box.width >= 900;
  const spread = (prefs.spread ?? wide) && total > 2 && !textView;
  const pages = spreadPages(page, total, spread);
  const canDraw = Boolean(source) && !textView && showMarks && !props.marksFailed;
  const activeTool: Tool = canDraw ? tool : "read";
  const updatePrefs = (patch: Partial<typeof prefs>) =>
    setPrefs((current) => {
      const next = { ...current, ...patch };
      savePrefs(next);
      return next;
    });

  // Só o leitor à vista: sem deslocar a página por trás.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // O tamanho das páginas à vista e das seguintes (para virar sem saltos).
  const wanted = useMemo(
    () => [
      ...new Set([
        ...spreadPages(page, total, spread),
        ...spreadPages(nextPage(page, total, spread), total, spread),
        ...spreadPages(previousPage(page, total, spread), total, spread),
      ]),
    ],
    [page, total, spread],
  );
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    for (const number of wanted) {
      if (sizes[number]) continue;
      source.size(number).then(
        (size) => !cancelled && setSizes((current) => ({ ...current, [number]: size })),
        () => undefined,
      );
    }
    return () => {
      cancelled = true;
    };
  }, [source, wanted, sizes]);

  const go = useCallback(
    (target: number) => {
      const next = Math.min(Math.max(1, target), total);
      if (next === page) return;
      setTurn(next > page ? "next" : "prev");
      setPage(next);
      setConfirmClear(false);
      rememberPage(doc.id, next);
      props.onPage(next);
      stage.current?.scrollTo({ top: 0 });
    },
    [doc.id, page, props, total],
  );
  const goNext = () => go(nextPage(page, total, spread));
  const goPrevious = () => go(previousPage(page, total, spread));

  const close = useCallback(() => {
    void editor.flush();
    if (document.fullscreenElement) void document.exitFullscreen();
    props.onClose();
  }, [editor, props]);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  }

  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2600);
  };
  useEffect(() => () => clearTimeout(idleTimer.current), []);
  const hideChrome = idle && activeTool === "read" && !panel && !confirmClear && !picker;

  const handleKey = useRef<(event: KeyboardEvent) => void>(() => undefined);
  handleKey.current = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === "z") {
      event.preventDefault();
      if (event.shiftKey) editor.redo();
      else editor.undo();
      return;
    }
    if (mod && key === "y") {
      event.preventDefault();
      editor.redo();
      return;
    }
    if (mod || event.altKey) return;
    wake();
    const actions: Record<string, () => void> = {
      escape: () => (panel ? setPanel(false) : confirmClear ? setConfirmClear(false) : close()),
      arrowright: goNext,
      pagedown: goNext,
      " ": event.shiftKey ? goPrevious : goNext,
      arrowleft: goPrevious,
      pageup: goPrevious,
      home: () => go(1),
      end: () => go(total),
      "+": () => setZoom((z) => Math.min(4, z * 1.25)),
      "=": () => setZoom((z) => Math.min(4, z * 1.25)),
      "-": () => setZoom((z) => Math.max(0.5, z / 1.25)),
      "0": () => setZoom(1),
      l: () => setTool("read"),
      m: () => canDraw && setTool("highlight"),
      s: () => canDraw && setTool("underline"),
      c: () => canDraw && setTool("pen"),
      b: () => canDraw && setTool("eraser"),
      f: toggleFullscreen,
      r: () => setRotation((r) => (r + 90) % 360),
    };
    const action = actions[key];
    if (action) {
      event.preventDefault();
      action();
    }
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKey.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const outline = useQuery({
    queryKey: ["outline", doc.id],
    enabled: panel && Boolean(source?.outline),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () => source!.outline!(),
  });

  // Escala: ajustar a página (ou o par de páginas) ao ecrã, ou à largura.
  const turnedSizes = pages.map((n) => {
    const s = sizes[n];
    if (!s) return null;
    return rotation % 180 === 0 ? s : { width: s.height, height: s.width };
  });
  const ready = turnedSizes.every(Boolean) && box.width > 0;
  let scale = 0;
  if (ready) {
    const sumWidth = turnedSizes.reduce((sum, s) => sum + s!.width, 0);
    const maxHeight = Math.max(...turnedSizes.map((s) => s!.height));
    const availWidth = prefs.fit === "width" ? Math.min(box.width, 1000 * pages.length) : box.width;
    scale =
      (prefs.fit === "width"
        ? availWidth / sumWidth
        : Math.min(availWidth / sumWidth, box.height / maxHeight)) * zoom;
  }

  const marks = editor.marks;
  const setPageStrokes = (number: number, strokes: Stroke[]) =>
    editor.change(withPage(marks, number, strokes));
  const visibleMarks = pages.reduce((sum, n) => sum + (marks[String(n)]?.length ?? 0), 0);
  const marked = markedPages(marks);
  const pageLabel =
    pages.length > 1
      ? t("reader.pages", { from: pages[0], to: pages[1], total })
      : t("reader.page", { page: pages[0], total });

  const tools: { id: Tool; label: string; icon: ReactNode }[] = [
    { id: "read", label: t("reader.tool_read"), icon: <IconHand /> },
    { id: "highlight", label: t("reader.tool_highlight"), icon: <IconHighlighter /> },
    { id: "underline", label: t("reader.tool_underline"), icon: <IconUnderline /> },
    { id: "pen", label: t("reader.tool_pen"), icon: <IconPen /> },
    { id: "eraser", label: t("reader.tool_eraser"), icon: <IconEraser /> },
  ];
  const drawingTool =
    activeTool === "highlight" || activeTool === "underline" || activeTool === "pen";
  const chrome = `transition-opacity duration-300 ${hideChrome ? "pointer-events-none opacity-0" : "opacity-100"}`;

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={t("reader.title")}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-night text-white outline-none"
      onPointerMove={wake}
    >
      {/* Barra de cima: sair, título, vista e estado das marcas. */}
      <header
        className={`absolute inset-x-0 top-0 z-20 flex h-12 items-center gap-1 bg-black/75 px-2 backdrop-blur ${chrome}`}
      >
        <ChromeButton label={t("reader.close")} onClick={close}>
          <IconClose />
        </ChromeButton>
        <div className="mr-2 min-w-0 flex-1 truncate font-serif text-sm text-white/85">
          {props.title}
          <span className="ml-2 text-xs text-white/50">{pageLabel}</span>
        </div>
        <div className="flex min-w-0 items-center overflow-x-auto">
          {source && (
            <>
              <ChromeButton
                label={t("reader.single")}
                active={!spread}
                disabled={textView || total <= 2}
                onClick={() => updatePrefs({ spread: false })}
              >
                <IconPage />
              </ChromeButton>
              <ChromeButton
                label={t("reader.spread")}
                active={spread}
                disabled={textView || total <= 2}
                onClick={() => updatePrefs({ spread: true })}
              >
                <IconBookOpen />
              </ChromeButton>
              <Separator />
              <ChromeButton
                label={t("reader.fit_page")}
                active={prefs.fit === "page"}
                onClick={() => {
                  updatePrefs({ fit: "page" as Fit });
                  setZoom(1);
                }}
              >
                <IconFitPage />
              </ChromeButton>
              <ChromeButton
                label={t("reader.fit_width")}
                active={prefs.fit === "width"}
                onClick={() => {
                  updatePrefs({ fit: "width" as Fit });
                  setZoom(1);
                }}
              >
                <IconFitWidth />
              </ChromeButton>
              <ChromeButton
                label={t("document.zoom_out")}
                disabled={zoom <= 0.5}
                onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}
              >
                −
              </ChromeButton>
              <ChromeButton label={t("document.zoom_reset")} onClick={() => setZoom(1)}>
                <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
              </ChromeButton>
              <ChromeButton
                label={t("document.zoom_in")}
                disabled={zoom >= 4}
                onClick={() => setZoom((z) => Math.min(4, z * 1.25))}
              >
                +
              </ChromeButton>
              <ChromeButton
                label={t("reader.rotate")}
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <IconRotate />
              </ChromeButton>
              <Separator />
            </>
          )}
          <ChromeButton
            label={t("reader.tone", { tone: t(`reader.tones.${prefs.tone}`) })}
            active={prefs.tone !== "paper"}
            onClick={() =>
              updatePrefs({ tone: TONES[(TONES.indexOf(prefs.tone) + 1) % TONES.length]! })
            }
          >
            <IconMoon />
          </ChromeButton>
          {source && doc.pages > 0 && (
            <ChromeButton
              label={textView ? t("reader.page_view") : t("reader.text_view")}
              active={textView}
              onClick={() => setTextView((v) => !v)}
            >
              <IconText />
            </ChromeButton>
          )}
          <ChromeButton
            label={t("reader.panel")}
            active={panel}
            onClick={() => setPanel((p) => !p)}
          >
            <IconList />
          </ChromeButton>
          <ChromeButton
            label={t("reader.fullscreen")}
            active={fullscreen}
            onClick={toggleFullscreen}
          >
            <IconExpand />
          </ChromeButton>
        </div>
        <span
          className={`ml-2 hidden shrink-0 text-xs sm:block ${
            editor.state === "error" ? "text-clay-soft" : "text-white/55"
          }`}
          role="status"
        >
          {t(saveLabel(editor.state, readOnly))}
        </span>
      </header>

      {/* O documento. */}
      <div
        ref={stage}
        className="flex min-h-0 flex-1 overflow-auto px-2 pt-14 pb-28 sm:px-6 md:px-20 md:pb-16"
        onPointerDown={(e) => {
          if (activeTool === "read" && e.pointerType === "touch")
            swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start || prefs.fit !== "page" || zoom > 1) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > 70 && Math.abs(e.clientY - start.y) < 60) {
            if (dx < 0) goNext();
            else goPrevious();
          }
        }}
      >
        {textView || !source ? (
          <div className="m-auto w-full" key={`texto-${page}`}>
            <ReaderText doc={doc} page={page} tone={prefs.tone} />
          </div>
        ) : !ready ? (
          <div className="m-auto">
            <Spinner />
          </div>
        ) : (
          <div key={pages.join("-")} className={`m-auto flex ${turn ? `reader-turn-${turn}` : ""}`}>
            {pages.map((number, index) => (
              <ReaderPage
                key={number}
                source={source}
                number={number}
                size={sizes[number]!}
                cssWidth={Math.floor(turnedSizes[index]!.width * scale)}
                rotation={rotation}
                tone={prefs.tone}
                strokes={marks[String(number)] ?? []}
                showMarks={showMarks}
                tool={activeTool}
                color={prefs.color}
                strokeSize={prefs.size}
                onStrokes={(next) => setPageStrokes(number, next)}
                gutter={pages.length > 1 ? (index === 0 ? "left" : "right") : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Virar a página (também com as setas, a roda, o deslizar do dedo). */}
      <button
        type="button"
        aria-label={t("reader.previous")}
        title={t("reader.previous")}
        disabled={pages[0]! <= 1}
        onClick={goPrevious}
        className={`absolute top-1/2 left-1 z-10 hidden -translate-y-1/2 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white disabled:invisible md:left-16 md:block ${chrome}`}
      >
        <IconChevronLeft size={30} />
      </button>
      <button
        type="button"
        aria-label={t("reader.next")}
        title={t("reader.next")}
        disabled={pages[pages.length - 1]! >= total}
        onClick={goNext}
        className={`absolute top-1/2 right-1 z-10 hidden -translate-y-1/2 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white disabled:invisible md:right-3 md:block ${chrome}`}
      >
        <IconChevronRight size={30} />
      </button>

      {/* Ferramentas: à esquerda em ecrãs largos, em baixo no telemóvel. */}
      {source && !textView && (
        <div
          role="toolbar"
          aria-label={t("reader.tools")}
          className={`absolute bottom-14 left-1/2 z-20 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-2xl bg-black/80 p-1 backdrop-blur md:top-1/2 md:bottom-auto md:left-3 md:max-h-[calc(100dvh-8rem)] md:-translate-x-0 md:-translate-y-1/2 md:flex-col md:overflow-x-visible md:overflow-y-auto ${chrome}`}
        >
          {tools.map((item) => (
            <ChromeButton
              key={item.id}
              label={item.label}
              active={activeTool === item.id}
              disabled={item.id !== "read" && !canDraw}
              onClick={() => {
                setTool(item.id);
                setPicker(false);
              }}
            >
              {item.icon}
            </ChromeButton>
          ))}
          <ChromeButton
            label={t("reader.style", {
              color: t(`reader.colors.${prefs.color}`),
              size: t(`reader.sizes.${prefs.size}`),
            })}
            active={picker}
            disabled={!drawingTool}
            onClick={() => setPicker((v) => !v)}
          >
            <span
              className="block rounded-full ring-1 ring-white/40"
              style={{
                background: `var(--color-mark-${prefs.color})`,
                width: 8 + STROKE_SIZES[prefs.size] * 7,
                height: 8 + STROKE_SIZES[prefs.size] * 7,
              }}
            />
          </ChromeButton>
          <Separator vertical />
          <ChromeButton label={t("reader.undo")} disabled={!editor.canUndo} onClick={editor.undo}>
            <IconUndo />
          </ChromeButton>
          <ChromeButton label={t("reader.redo")} disabled={!editor.canRedo} onClick={editor.redo}>
            <IconRedo />
          </ChromeButton>
          <ChromeButton
            label={pages.length > 1 ? t("reader.clear_pages") : t("reader.clear_page")}
            disabled={!canDraw || visibleMarks === 0}
            onClick={() =>
              editor.change(pages.reduce((acc: PageMarks, n) => withPage(acc, n, []), marks))
            }
          >
            <IconClearPage />
          </ChromeButton>
          <ChromeButton
            label={t("reader.clear_all")}
            disabled={!canDraw || marked.length === 0}
            onClick={() => setConfirmClear(true)}
          >
            <IconTrash />
          </ChromeButton>
          <Separator vertical />
          <ChromeButton
            label={showMarks ? t("reader.show_original") : t("reader.show_marks")}
            active={!showMarks}
            onClick={() => setShowMarks((v) => !v)}
          >
            <IconEye />
          </ChromeButton>
        </div>
      )}

      {/* Cor e espessura do marcador, do sublinhado e da caneta. */}
      {picker && drawingTool && (
        <fieldset
          aria-label={t("reader.style_title")}
          className="absolute bottom-28 left-1/2 z-30 w-max -translate-x-1/2 space-y-2 rounded-2xl bg-black/90 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur md:top-1/2 md:bottom-auto md:left-18 md:-translate-x-0 md:-translate-y-1/2"
        >
          <div className="flex items-center gap-1">
            {MARK_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={t("reader.color", { color: t(`reader.colors.${color}`) })}
                title={t("reader.color", { color: t(`reader.colors.${color}`) })}
                aria-pressed={prefs.color === color}
                onClick={() => updatePrefs({ color })}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
              >
                <span
                  className={`block h-6 w-6 rounded-full ${
                    prefs.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""
                  }`}
                  style={{ background: `var(--color-mark-${color})` }}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(Object.keys(STROKE_SIZES) as StrokeSize[]).map((size) => (
              <ChromeButton
                key={size}
                label={t("reader.size", { size: t(`reader.sizes.${size}`) })}
                active={prefs.size === size}
                onClick={() => updatePrefs({ size })}
              >
                <span
                  className="block rounded-full bg-current"
                  style={{ width: 4 + STROKE_SIZES[size] * 6, height: 4 + STROKE_SIZES[size] * 6 }}
                />
              </ChromeButton>
            ))}
          </div>
        </fieldset>
      )}

      {confirmClear && (
        <div
          role="alertdialog"
          aria-label={t("reader.clear_all")}
          className="absolute top-16 left-1/2 z-30 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 space-y-3 rounded-2xl bg-navy p-4 text-sm shadow-xl ring-1 ring-gold/40"
        >
          <p>{t("reader.clear_all_confirm")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-clay px-3 py-1.5 font-medium text-white hover:bg-clay/90"
              onClick={() => {
                editor.change({});
                setConfirmClear(false);
              }}
            >
              {t("reader.clear_all_yes")}
            </button>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-white/80 hover:bg-white/10"
              onClick={() => setConfirmClear(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {!showMarks && (
        <p className="pointer-events-none absolute top-14 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white/80">
          {t("reader.original_badge")}
        </p>
      )}
      {props.marksFailed && (
        <p className="absolute top-14 left-1/2 z-10 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl bg-clay/90 px-3 py-2 text-xs">
          {t("reader.marks_error")}
        </p>
      )}

      {/* Páginas: deslizar para ir longe. */}
      <footer
        className={`absolute inset-x-0 bottom-0 z-20 flex h-12 items-center justify-center gap-3 bg-black/60 px-4 backdrop-blur ${chrome}`}
      >
        <button
          type="button"
          aria-label={t("reader.previous")}
          disabled={pages[0]! <= 1}
          onClick={goPrevious}
          className="rounded-full p-1 text-white/70 hover:text-white disabled:opacity-30 md:hidden"
        >
          <IconChevronLeft />
        </button>
        <input
          type="range"
          min={1}
          max={total}
          value={page}
          disabled={total <= 1}
          aria-label={t("reader.slider")}
          onChange={(e) => go(Number(e.target.value))}
          className="w-[min(32rem,60vw)] accent-gold"
        />
        <span className="min-w-20 text-center text-xs text-white/70 tabular-nums">
          {pages.length > 1 ? `${pages[0]}–${pages[1]}` : pages[0]} / {total}
        </span>
        <button
          type="button"
          aria-label={t("reader.next")}
          disabled={pages[pages.length - 1]! >= total}
          onClick={goNext}
          className="rounded-full p-1 text-white/70 hover:text-white disabled:opacity-30 md:hidden"
        >
          <IconChevronRight />
        </button>
      </footer>

      {/* Índice do documento e páginas com marcas. */}
      {panel && (
        <aside
          aria-label={t("reader.panel")}
          className="absolute top-12 right-0 bottom-12 z-30 w-[min(22rem,100vw)] space-y-5 overflow-y-auto bg-navy/95 p-4 shadow-2xl backdrop-blur"
        >
          <section className="space-y-2">
            <h2 className="font-display text-xs tracking-widest text-gold-light uppercase">
              {t("reader.my_marks")}
            </h2>
            <p className="text-xs text-white/55">{t("reader.private_note")}</p>
            {marked.length === 0 ? (
              <p className="text-sm text-white/70">{t("reader.no_marks")}</p>
            ) : (
              <ul className="space-y-0.5">
                {marked.map((entry) => (
                  <li key={entry.page}>
                    <button
                      type="button"
                      onClick={() => go(entry.page)}
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-white/10"
                    >
                      {t("reader.marks_on_page", { page: entry.page, count: entry.count })}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {source?.outline && (
            <section className="space-y-2">
              <h2 className="font-display text-xs tracking-widest text-gold-light uppercase">
                {t("reader.outline")}
              </h2>
              {outline.isLoading && <Spinner />}
              {outline.data && outline.data.length === 0 && (
                <p className="text-sm text-white/70">{t("reader.no_outline")}</p>
              )}
              {outline.data && outline.data.length > 0 && (
                <OutlineList items={outline.data} onGo={go} />
              )}
            </section>
          )}
        </aside>
      )}
    </div>
  );
}

/** Carrega o documento (PDF por partes, imagem ou só texto) e as marcas, e abre o leitor. */
export function Reader(props: {
  doc: DocumentRow;
  /** O nome que se mostra (o mesmo da página do documento). */
  title: string;
  page: number;
  onPage: (page: number) => void;
  onClose: () => void;
}) {
  // Directamente no <body>: nada da página por trás (nem um contentor com transform) o limita.
  return createPortal(<ReaderLoader {...props} />, document.body);
}

function ReaderLoader(props: {
  doc: DocumentRow;
  title: string;
  page: number;
  onPage: (page: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { doc } = props;
  const isImage = IMAGE_EXTS.has(doc.ext);
  const original = hasOriginalView(doc);
  const pdf = usePdf(original && !isImage ? doc : undefined);
  const image = useBinary(original && isImage ? doc.original_path : null);
  const bitmap = useQuery({
    queryKey: ["bitmap", doc.original_path],
    enabled: Boolean(image.data),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () => createImageBitmap(new Blob([image.data!.slice()], { type: doc.mime })),
  });
  const marks = useSavedMarks(doc);
  const source = useMemo(
    () => (pdf.data ? pdfSource(pdf.data) : bitmap.data ? imageSource(bitmap.data) : null),
    [pdf.data, bitmap.data],
  );
  const loadingOriginal = original && !source && !pdf.error && !image.error && !bitmap.error;
  const error = pdf.error ?? image.error ?? bitmap.error;

  if (marks.isLoading || loadingOriginal || error) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("reader.title")}
        className="fixed inset-0 z-50 grid place-items-center bg-night p-6 text-white"
      >
        <div className="w-full max-w-md space-y-4 text-center">
          {error ? (
            <ErrorBox error={error} />
          ) : (
            <>
              <div className="flex justify-center text-white/80 [&_p]:text-white/80">
                <Spinner />
              </div>
              {doc.size >= 8 * 1024 * 1024 && (
                <p className="text-sm text-white/60">
                  {t("reader.loading_big", { size: formatBytes(doc.size) })}
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/20 hover:bg-white/10"
          >
            {t("reader.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReaderView
      doc={doc}
      title={props.title}
      source={source}
      loaded={marks.data ?? { file: emptyAnnotations(doc.id, doc.sha256), unsaved: false }}
      marksFailed={Boolean(marks.error)}
      page={props.page}
      onPage={props.onPage}
      onClose={props.onClose}
    />
  );
}
