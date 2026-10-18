// Página de um documento: o título (o nome que lhe deste ou um a partir da classificação),
// «Ler» (modo de leitura em ecrã inteiro, com as tuas marcas), o original ou o texto ao lado da
// classificação, e o resto (visibilidade, notas, conjuntos, cópias, origens).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router";
import { BundleEditor } from "../../components/BundleEditor";
import {
  hasOriginalView as canShowOriginal,
  IMAGE_EXTS,
  OriginalPane,
  TextPane,
} from "../../components/DocumentViewer";
import { FileBadge } from "../../components/FileBadge";
import { IconBookOpen, IconDownload, IconExpand } from "../../components/icons";
import { Badge, Button, buttonClass, Card, Empty, ErrorBox, Spinner } from "../../components/ui";
import { DocumentVisibility, PublicBadge } from "../../components/Visibility";
import { useApp } from "../../data/context";
import { markCount, markedPages } from "../../lib/annotations";
import { formatBytes } from "../../lib/files";
import { formatWhen, useLabels } from "../../lib/labels";
import { lastPage } from "../../lib/reader";
import { documentDate, documentTitle, originalName } from "../../lib/titles";
import { ClassificationFields, TitleEditor } from "./DocumentFields";
import { Reader } from "./Reader";
import { useSavedMarks } from "./useMarks";

export function DocumentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { meta, source, login, notifyCommit, indexLoading, readOnly, to } = useApp();
  const labels = useLabels(meta);
  const doc = id ? meta?.document(id) : undefined;
  const page = Number(params.get("pagina") ?? 1) || 1;
  const reading = params.get("ler") === "1";
  const setPage = (p: number, replace = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("pagina", String(p));
        return next;
      },
      { replace },
    );
  const hasOriginalView = doc && canShowOriginal(doc);
  const [tab, setTab] = useState<"text" | "original">(hasOriginalView ? "original" : "text");
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const marks = useSavedMarks(doc);

  if (indexLoading) return <Spinner />;
  if (!doc) return <Empty>{t("document.not_found")}</Empty>;

  /** Abre o modo de leitura (o «Voltar» do browser fecha-o). */
  const openReader = (at: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pagina", String(at));
      next.set("ler", "1");
      return next;
    });
  const closeReader = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("ler");
        return next;
      },
      { replace: true },
    );

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
    a.download = originalName(doc!);
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
  // O dono e quem entrou com um código de acesso (que usa o token do dono); nunca visitantes.
  const isOwner = doc.owner === login && !readOnly;
  const canRead = hasOriginalView || doc.pages > 0;
  const resume = lastPage(doc.id);
  const pageMarks = marks.data?.file.pages ?? {};
  const totalMarks = markCount(pageMarks);
  const markedCount = markedPages(pageMarks).length;
  const title = documentTitle(doc, labels);
  const date = documentDate(doc, labels);
  const unitName = doc.unit ? labels.unit(doc.unit) : null;
  const typeName = doc.document_type ? labels.term("document_types", doc.document_type) : null;
  const facts = [
    typeName,
    doc.academic_year?.replace("-", "/"),
    date,
    doc.pages > 0 ? t("document.pages_count", { count: doc.pages }) : null,
    formatBytes(doc.size),
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {reading && canRead && (
        <Reader
          doc={doc}
          title={title}
          page={page}
          onPage={(p) => setPage(p, true)}
          onClose={closeReader}
        />
      )}
      <header className="space-y-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link className="hover:text-pen hover:underline" to={to("/biblioteca")}>
            {t("nav.library")}
          </Link>
          {doc.unit && unitName && (
            <>
              <span aria-hidden="true">›</span>
              <Link
                className="hover:text-pen hover:underline"
                to={to(`/biblioteca?uc=${encodeURIComponent(doc.unit)}`)}
              >
                {unitName}
              </Link>
            </>
          )}
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[min(100%,24rem)] flex-1 space-y-1.5">
            <TitleEditor key={doc.id} doc={doc} title={title} canEdit={isOwner} />
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
              <FileBadge ext={doc.ext} kind={doc.kind} />
              {facts.map((fact, index) => (
                <span key={String(fact)} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">·</span>}
                  {fact}
                </span>
              ))}
            </p>
            <p className="text-xs break-all text-muted">
              {t("document.original_name", { name: originalName(doc) })}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge>{t(`status.${doc.status}`)}</Badge>
              {doc.needs_review && <Badge tone="warn">{t("nav.review")}</Badge>}
              {isOwner && <PublicBadge value={doc.visibility} />}
              {doc.pages_needing_transcription > 0 && (
                <Badge tone="info">
                  {t("document.needs_transcription", { count: doc.pages_needing_transcription })}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canRead && (
              <Button onClick={() => openReader(resume ?? page)}>
                <span className="inline-flex items-center gap-2">
                  <IconBookOpen />
                  {resume ? t("document.read_continue", { page: resume }) : t("document.read")}
                </span>
              </Button>
            )}
            <Button variant="secondary" onClick={() => void downloadOriginal()}>
              <span className="inline-flex items-center gap-2">
                <IconDownload />
                {t("document.download")}
              </span>
            </Button>
            {isOwner && doc.needs_review && (
              <Link to={to(`/rever?doc=${doc.id}`)} className={buttonClass("secondary")}>
                {t("document.correct")}
              </Link>
            )}
          </div>
        </div>
      </header>
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card
          className="self-start lg:sticky lg:top-4"
          actions={
            <div className="flex flex-wrap gap-1">
              {hasOriginalView && (
                <>
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
                </>
              )}
              {canRead && (
                <Button
                  variant="ghost"
                  aria-label={t("document.open_reader")}
                  title={t("document.open_reader")}
                  onClick={() => openReader(page)}
                >
                  <IconExpand />
                </Button>
              )}
            </div>
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
          {reading ? null : tab === "original" && hasOriginalView ? (
            <OriginalPane doc={doc} page={page} setPage={setPage} marks={pageMarks} />
          ) : (
            <TextPane doc={doc} page={page} setPage={setPage} />
          )}
        </Card>
        <div className="space-y-4">
          <Card title={t("document.classification")}>
            <ClassificationFields key={doc.id} doc={doc} labels={labels} canEdit={isOwner} />
          </Card>
          {canRead && (
            <Card title={t("document.my_marks")}>
              <div className="space-y-2 text-sm">
                {totalMarks > 0 ? (
                  <p>
                    {t("document.marks_count", { count: totalMarks })}{" "}
                    {t("document.marks_pages", { count: markedCount })}
                  </p>
                ) : (
                  <p className="text-ink-soft">{t("document.no_marks")}</p>
                )}
                <p className="text-xs text-muted">{t("document.marks_private")}</p>
                <Button variant="secondary" onClick={() => openReader(resume ?? page)}>
                  {totalMarks > 0 ? t("document.marks_open") : t("document.marks_start")}
                </Button>
              </div>
            </Card>
          )}
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
          {doc.bundle_id && (
            <Card title={t("bundle.title", { name: doc.bundle_name })}>
              <BundleEditor key={doc.id} doc={doc} />
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
      </div>
    </div>
  );
}
