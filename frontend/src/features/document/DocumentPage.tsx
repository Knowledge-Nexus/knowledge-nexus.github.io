import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router";
import { Markdown } from "../../components/Markdown";
import { PdfViewer } from "../../components/PdfViewer";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  ConfidenceBadge,
  Empty,
  ErrorBox,
  ReasonList,
  Spinner,
} from "../../components/ui";
import { DocumentVisibility, PublicBadge } from "../../components/Visibility";
import { useApp } from "../../data/context";
import { CLASSIFICATION_FIELDS, type DocumentRow } from "../../data/types";
import { formatBytes } from "../../lib/files";
import { formatWhen, useLabels } from "../../lib/labels";

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);

function useBinary(path: string | null) {
  const { source } = useApp();
  return useQuery({
    queryKey: ["binary", path],
    enabled: Boolean(path),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () => source.binary(path!),
  });
}

function TextPane(props: { doc: DocumentRow; page: number; setPage: (p: number) => void }) {
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

function OriginalPane(props: { doc: DocumentRow; page: number; setPage: (p: number) => void }) {
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

export function DocumentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { meta, source, login, notifyCommit, indexLoading, readOnly, to } = useApp();
  const labels = useLabels(meta);
  const doc = id ? meta?.document(id) : undefined;
  const page = Number(params.get("pagina") ?? 1) || 1;
  const setPage = (p: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pagina", String(p));
      return next;
    });
  const hasOriginalView = doc && (doc.ext === "pdf" || doc.rendition || IMAGE_EXTS.has(doc.ext));
  const [tab, setTab] = useState<"text" | "original">(hasOriginalView ? "original" : "text");
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  if (indexLoading) return <Spinner />;
  if (!doc) return <Empty>{t("document.not_found")}</Empty>;

  async function patch(mutate: (record: Record<string, unknown>) => void, message: string) {
    setError(null);
    try {
      await source.patchDocument(doc!.id, mutate, message);
      notifyCommit();
    } catch (err) {
      setError(err);
    }
  }

  async function downloadOriginal() {
    const bytes = await source.binary(doc!.original_path);
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: doc!.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = doc!.display_name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const duplicates = meta?.nearDuplicates(doc.id) ?? [];
  const copies = meta?.copiesOf(doc.id) ?? [];
  const copyOf = doc.duplicate_of ? meta?.document(doc.duplicate_of) : undefined;

  /** "Não são iguais": a cópia passa a documento separado na próxima execução. */
  function notSame(copyId: string, originalId: string) {
    return source.patchDocument(
      copyId,
      (r) => {
        const list = (r.near_duplicates_dismissed as string[] | undefined) ?? [];
        r.near_duplicates_dismissed = [...new Set([...list, originalId])];
      },
      `não é cópia: ${copyId}`,
    );
  }
  const children = doc.kind === "archive" ? (meta?.children(doc.id) ?? []) : [];
  const isOwner = doc.owner === login && !readOnly;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold break-all text-ink">
            {doc.display_name}
          </h1>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge>{t(`status.${doc.status}`)}</Badge>
            {doc.needs_review && <Badge tone="warn">{t("nav.review")}</Badge>}
            {isOwner && <PublicBadge value={doc.visibility} />}
            <Badge>{formatBytes(doc.size)}</Badge>
            {doc.pages_needing_transcription > 0 && (
              <Badge tone="info">
                {t("document.needs_transcription", { count: doc.pages_needing_transcription })}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void downloadOriginal()}>
            {t("document.download")}
          </Button>
          {isOwner && (
            <Link to={to(`/rever?doc=${doc.id}`)} className={buttonClass("primary")}>
              {t("document.correct")}
            </Link>
          )}
        </div>
      </div>
      {error ? <ErrorBox error={error} /> : null}
      {copyOf && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-marker/60 bg-marker-soft px-4 py-3 text-sm">
          <p className="flex-1">{t("document.copy_of", { name: copyOf.display_name })}</p>
          <Link to={to(`/documento/${copyOf.id}`)} className={buttonClass("secondary")}>
            {t("document.open_original")}
          </Link>
          {isOwner && (
            <Button
              variant="ghost"
              onClick={() =>
                void notSame(doc.id, copyOf.id).then(notifyCommit, (err: unknown) => setError(err))
              }
            >
              {t("document.not_same")}
            </Button>
          )}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <Card title={t("document.classification")}>
            <dl className="space-y-2 text-sm">
              {CLASSIFICATION_FIELDS.map((field) => {
                const value = doc.classification[field];
                if (!value) return null;
                return (
                  <div key={field}>
                    <dt className="flex items-center justify-between gap-2 text-xs text-muted">
                      {t(`fields.${field}`)} <ConfidenceBadge field={value} />
                    </dt>
                    <dd className="font-medium">{labels.value(field, value.value)}</dd>
                    {value.reasons?.length ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted">{t("document.why")}</summary>
                        <ReasonList reasons={value.reasons} />
                      </details>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </Card>
          {isOwner && (
            <Card title={t("visibility.document_label")}>
              <DocumentVisibility key={doc.id} doc={doc} />
            </Card>
          )}
          {isOwner && (
            <Card title={t("document.notes")}>
              <textarea
                className="h-28 w-full rounded-xl border border-line-strong p-2 text-sm"
                placeholder={t("document.notes_placeholder")}
                value={notes ?? doc.notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                disabled={notes === null || notes === doc.notes}
                onClick={() =>
                  void patch((r) => {
                    r.notes = notes ?? "";
                  }, `notas: ${doc.display_name}`)
                }
              >
                {t("common.save")}
              </Button>
            </Card>
          )}
          {copies.length > 0 && (
            <Card title={t("document.copies_title")}>
              <p className="mb-2 text-xs text-muted">{t("document.copies_text")}</p>
              <ul className="space-y-1 text-sm">
                {copies.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Link className="truncate underline" to={to(`/documento/${c.id}`)}>
                      {c.source_path?.split("/").pop() ?? c.display_name}
                    </Link>
                    {isOwner && (
                      <button
                        type="button"
                        className="shrink-0 text-xs text-muted underline"
                        onClick={() =>
                          void notSame(c.id, doc.id).then(notifyCommit, (err: unknown) =>
                            setError(err),
                          )
                        }
                      >
                        {t("document.not_same")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {duplicates.length > 0 && (
            <Card title={t("document.near_duplicates")}>
              <ul className="space-y-1 text-sm">
                {duplicates.map((d) => (
                  <li key={d.other} className="flex items-center justify-between gap-2">
                    <Link className="truncate underline" to={to(`/documento/${d.other}`)}>
                      {meta?.document(d.other)?.display_name ?? d.other} (
                      {Math.round(d.score * 100)}%)
                    </Link>
                    {isOwner && (
                      <button
                        type="button"
                        className="text-xs text-muted underline"
                        onClick={() =>
                          void patch((r) => {
                            const list =
                              (r.near_duplicates_dismissed as string[] | undefined) ?? [];
                            r.near_duplicates_dismissed = [...new Set([...list, d.other])];
                          }, `não é duplicado: ${doc.display_name}`)
                        }
                      >
                        {t("document.not_duplicate")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {doc.sources.length > 0 && (
            <Card title={t("document.sources")}>
              <ul className="space-y-1 text-xs">
                {doc.sources.map((s) => (
                  <li key={`${s.via}-${s.path}-${s.batch ?? ""}`} className="font-mono break-all">
                    {s.path}{" "}
                    <span className="text-muted">
                      ({s.via}, {formatWhen(s.received_at)})
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <Card
          actions={
            hasOriginalView ? (
              <div className="flex gap-1">
                <Button
                  variant={tab === "original" ? "primary" : "secondary"}
                  onClick={() => setTab("original")}
                >
                  {IMAGE_EXTS.has(doc.ext) ? t("document.image") : t("document.pdf")}
                </Button>
                <Button
                  variant={tab === "text" ? "primary" : "secondary"}
                  onClick={() => setTab("text")}
                >
                  {t("document.text")}
                </Button>
              </div>
            ) : undefined
          }
        >
          {doc.manifest && (
            <details className="mb-3 text-xs">
              <summary className="cursor-pointer font-medium">{t("document.manifest")}</summary>
              <ul className="mt-1 font-mono">
                {doc.manifest.files.map((f) => (
                  <li key={f.path}>{f.path}</li>
                ))}
                {doc.manifest.ignored.map((i) => (
                  <li key={i.path} className="text-muted">
                    {t("document.ignored", { path: i.path, files: i.files })}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {children.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted">{t("document.children")}</p>
              <ul className="text-sm">
                {children.map((c) => (
                  <li key={c.id}>
                    <Link className="underline" to={to(`/documento/${c.id}`)}>
                      {c.source_path?.split("!/").pop() ?? c.display_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "original" && hasOriginalView ? (
            <OriginalPane doc={doc} page={page} setPage={setPage} />
          ) : (
            <TextPane doc={doc} page={page} setPage={setPage} />
          )}
        </Card>
      </div>
    </div>
  );
}
