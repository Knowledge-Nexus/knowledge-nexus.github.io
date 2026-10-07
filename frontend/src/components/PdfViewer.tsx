// Visualizador pdf.js: abre o PDF (bytes vindos do repositório privado) na página pedida.

import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ErrorBox, Spinner } from "./ui";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;

export function PdfViewer(props: {
  data: Uint8Array;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [rotation, setRotation] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setError(null);
    setRotation(0);
    const task = pdfjs.getDocument({ data: props.data.slice() });
    task.promise.then(
      (loaded) => {
        if (!cancelled) setDoc(loaded);
      },
      (err: unknown) => {
        if (!cancelled) setError(err);
      },
    );
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [props.data]);

  useEffect(() => {
    if (!doc || !canvas.current || !size.width || !size.height) return;
    let cancelled = false;
    let cancelRendering: (() => void) | undefined;
    const target = canvas.current;
    const number = Math.min(Math.max(1, props.page), doc.numPages);
    void doc.getPage(number).then((page) => {
      if (cancelled) return;
      const pageViewport = page.getViewport({ scale: 1, rotation: (page.rotate + rotation) % 360 });
      const scale = Math.min(size.width / pageViewport.width, size.height / pageViewport.height);
      const pixelRatio = window.devicePixelRatio || 1;
      const renderViewport = page.getViewport({
        scale: scale * pixelRatio,
        rotation: (page.rotate + rotation) % 360,
      });
      target.width = renderViewport.width;
      target.height = renderViewport.height;
      target.style.width = `${pageViewport.width * scale}px`;
      target.style.height = `${pageViewport.height * scale}px`;
      const context = target.getContext("2d");
      if (context) {
        const renderTask = page.render({
          canvasContext: context,
          viewport: renderViewport,
          canvas: target,
        });
        cancelRendering = () => renderTask.cancel();
        void renderTask.promise.catch((err: unknown) => {
          if (!cancelled && !(err instanceof Error && err.name === "RenderingCancelledException"))
            setError(err);
        });
      }
    });
    return () => {
      cancelled = true;
      cancelRendering?.();
    };
  }, [doc, props.page, rotation, size]);

  if (error) return <ErrorBox error={error} />;
  if (!doc) return <Spinner />;
  const page = Math.min(Math.max(1, props.page), doc.numPages);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => props.onPageChange(page - 1)}
        >
          {t("document.previous")}
        </Button>
        <span>{t("document.page", { page, total: doc.numPages })}</span>
        <Button
          variant="secondary"
          disabled={page >= doc.numPages}
          onClick={() => props.onPageChange(page + 1)}
        >
          {t("document.next")}
        </Button>
        <span className="mx-1 h-5 border-l border-line-strong" aria-hidden="true" />
        <Button
          variant="secondary"
          aria-label={t("document.rotate_left")}
          title={t("document.rotate_left")}
          onClick={() => setRotation((current) => (current + 270) % 360)}
        >
          ↶
        </Button>
        <Button
          variant="secondary"
          aria-label={t("document.rotate_right")}
          title={t("document.rotate_right")}
          onClick={() => setRotation((current) => (current + 90) % 360)}
        >
          ↷
        </Button>
      </div>
      <div
        ref={viewport}
        className="flex h-[min(65dvh,48rem)] min-h-64 items-center justify-center overflow-auto rounded-lg bg-paper p-2"
      >
        <canvas ref={canvas} className="max-w-full rounded border border-line shadow-sm" />
      </div>
    </div>
  );
}
