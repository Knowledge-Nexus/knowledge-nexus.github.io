// Visualização de um documento: o original (PDF, versão PDF dos Office ou imagem) ou o
// texto extraído, página a página. Usado na página do documento e em «A rever».

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../data/context";
import type { DocumentRow } from "../data/types";
import { Markdown } from "./Markdown";
import { PdfViewer } from "./PdfViewer";
import { Button, Empty, ErrorBox, Spinner } from "./ui";

export const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);

function useBinary(path: string | null) {
  const { source } = useApp();
  return useQuery({
    queryKey: ["binary", path],
    enabled: Boolean(path),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () => source.binary(path!),
  });
}

export function TextPane(props: { doc: DocumentRow; page: number; setPage: (p: number) => void }) {
  const { t } = useTranslation();
  const { source } = useApp();
  const total = Math.max(props.doc.pages, 1);
  const text = useQuery({
    queryKey: ["page", props.doc.sha256, props.page],
    queryFn: () => source.pageText(props.doc.sha256, props.page),
    retry: false,
  });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="secondary"
          disabled={props.page <= 1}
          onClick={() => props.setPage(props.page - 1)}
        >
          {t("document.previous")}
        </Button>
        <span>{t("document.page", { page: props.page, total })}</span>
        <Button
          variant="secondary"
          disabled={props.page >= total}
          onClick={() => props.setPage(props.page + 1)}
        >
          {t("document.next")}
        </Button>
      </div>
      {text.isLoading && <Spinner />}
      {text.data?.trim() ? (
        <Markdown>{text.data}</Markdown>
      ) : (
        !text.isLoading && <Empty>{t("document.no_text")}</Empty>
      )}
    </div>
  );
}

export function OriginalPane(props: {
  doc: DocumentRow;
  page: number;
  setPage: (p: number) => void;
}) {
  const { doc } = props;
  const pdfPath = doc.ext === "pdf" ? doc.original_path : doc.rendition;
  const isImage = IMAGE_EXTS.has(doc.ext);
  const binary = useBinary(pdfPath ?? (isImage ? doc.original_path : null));
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage || !binary.data) return;
    const objectUrl = URL.createObjectURL(new Blob([binary.data.slice()], { type: doc.mime }));
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [isImage, binary.data, doc.mime]);
  if (binary.isLoading) return <Spinner />;
  if (binary.error) return <ErrorBox error={binary.error} />;
  if (isImage && url)
    return <img src={url} alt={doc.display_name} className="max-w-full rounded border" />;
  if (pdfPath && binary.data)
    return <PdfViewer data={binary.data} page={props.page} onPageChange={props.setPage} />;
  return null;
}

export function hasOriginalView(doc: DocumentRow): boolean {
  return doc.ext === "pdf" || Boolean(doc.rendition) || IMAGE_EXTS.has(doc.ext);
}

/** Pré-visualização com separadores (original / texto), a abrir no original. */
export function DocumentPreview(props: { doc: DocumentRow }) {
  const { t } = useTranslation();
  const { doc } = props;
  const original = hasOriginalView(doc);
  const [tab, setTab] = useState<"original" | "text">(original ? "original" : "text");
  const [page, setPage] = useState(1);
  return (
    <div className="space-y-2">
      {original && (
        <div className="flex gap-1">
          <Button
            variant={tab === "original" ? "primary" : "secondary"}
            onClick={() => setTab("original")}
          >
            {IMAGE_EXTS.has(doc.ext) ? t("document.image") : t("document.pdf")}
          </Button>
          <Button variant={tab === "text" ? "primary" : "secondary"} onClick={() => setTab("text")}>
            {t("document.text")}
          </Button>
        </div>
      )}
      <div className="max-h-[36rem] overflow-auto rounded-lg bg-paper p-3">
        {tab === "original" && original ? (
          <OriginalPane doc={doc} page={page} setPage={setPage} />
        ) : (
          <TextPane doc={doc} page={page} setPage={setPage} />
        )}
      </div>
    </div>
  );
}
