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
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
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
    if (!doc || !canvas.current) return;
    let cancelled = false;
    const target = canvas.current;
    const number = Math.min(Math.max(1, props.page), doc.numPages);
    void doc.getPage(number).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1.4 });
      target.width = viewport.width;
      target.height = viewport.height;
      const context = target.getContext("2d");
      if (context) void page.render({ canvasContext: context, viewport, canvas: target }).promise;
    });
    return () => {
      cancelled = true;
    };
  }, [doc, props.page]);

  if (error) return <ErrorBox error={error} />;
  if (!doc) return <Spinner />;
  const page = Math.min(Math.max(1, props.page), doc.numPages);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
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
      </div>
      <canvas ref={canvas} className="max-w-full rounded border border-slate-200 shadow-sm" />
    </div>
  );
}
