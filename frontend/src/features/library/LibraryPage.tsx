import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { FileBadge } from "../../components/FileBadge";
import { IconArrowRight, IconDownload, IconGlobe, IconLock } from "../../components/icons";
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorBox,
  Notice,
  PageHeader,
  Spinner,
  unitColor,
} from "../../components/ui";
import { isPublic, PublicBadge, TypeVisibility, UnitVisibility } from "../../components/Visibility";
import { useApp } from "../../data/context";
import type { DocumentRow, UnitRow } from "../../data/types";
import { downloadZip } from "../../lib/download";
import { useLabels } from "../../lib/labels";
import { documentDate, documentTitle, originalName } from "../../lib/titles";

export function DocumentLink(props: {
  doc: DocumentRow;
  showUnit?: boolean;
  /** Numa lista já agrupada por tipo, o tipo não se repete no título. */
  groupedByType?: boolean;
  selected?: boolean;
  onSelect?: (on: boolean) => void;
}) {
  const { t } = useTranslation();
  const { meta, to, readOnly } = useApp();
  const labels = useLabels(meta);
  const { doc } = props;
  const title = documentTitle(doc, labels, !props.groupedByType);
  const file = originalName(doc);
  const details = [
    props.showUnit ? (doc.unit ? labels.unit(doc.unit) : t("library.no_unit")) : null,
    documentDate(doc, labels),
    file !== title ? file : null,
  ].filter(Boolean);
  return (
    <div className="group flex items-center gap-2 rounded-xl px-1 transition hover:bg-paper">
      {props.onSelect && (
        <input
          type="checkbox"
          className="ml-1 h-4 w-4 shrink-0 accent-[var(--color-pen)]"
          checked={props.selected ?? false}
          onChange={(e) => props.onSelect?.(e.target.checked)}
          aria-label={t("library.select_doc", { name: title })}
        />
      )}
      <Link
        to={to(`/documento/${doc.id}`)}
        className="flex min-w-0 flex-1 items-center gap-3 py-2"
        title={doc.display_name}
      >
        <FileBadge ext={doc.ext} kind={doc.kind} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{title}</span>
          {details.length > 0 && (
            <span className="block truncate text-xs text-muted">{details.join(" · ")}</span>
          )}
        </span>
        <span className="flex shrink-0 gap-1">
          {!readOnly && <PublicBadge value={doc.visibility} />}
          {doc.needs_review && <Badge tone="warn">{t("nav.review")}</Badge>}
        </span>
      </Link>
    </div>
  );
}

/** Uma cadeira apresentada como um livro: lombada de cor, sigla e nome. */
export function UnitBook(props: { unit: UnitRow; count: number; subtitle?: string }) {
  const { t } = useTranslation();
  const { meta, login, to, readOnly } = useApp();
  const { unit } = props;
  const color = unitColor(unit.key);
  const shared = !readOnly && isPublic(meta?.unitVisibility(login)[unit.key]);
  return (
    <Link
      to={to(`/biblioteca?uc=${encodeURIComponent(unit.key)}`)}
      className="group relative flex overflow-hidden rounded-2xl border border-line bg-sheet transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(29,39,51,0.45)]"
    >
      <span className="w-3 shrink-0" style={{ backgroundColor: color }} />
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-4">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
          style={{ color }}
        >
          {unit.acronym ?? unit.code ?? unit.slug}
          {shared && (
            <span className="text-pen" title={t("visibility.badge")}>
              <IconGlobe size={13} />
              <span className="sr-only">{t("visibility.badge")}</span>
            </span>
          )}
        </span>
        <span className="font-serif text-lg leading-snug font-semibold text-ink">{unit.name}</span>
        <span className="mt-1 text-xs text-muted">
          {props.subtitle ? `${props.subtitle} · ` : ""}
          {t("library.documents", { count: props.count })}
        </span>
      </span>
      <span className="self-center pr-4 text-line-strong transition group-hover:text-pen">
        <IconArrowRight />
      </span>
    </Link>
  );
}

/** Ordem dentro de um tipo: mais recentes primeiro (ano, data da prova), depois o título. */
function byRecency(a: DocumentRow, b: DocumentRow): number {
  const key = (d: DocumentRow) =>
    `${d.academic_year ?? ""}|${String(d.classification.date?.value ?? "")}`;
  return key(b).localeCompare(key(a)) || a.display_name.localeCompare(b.display_name);
}

function UnitDetail(props: { unitKey: string }) {
  const { t } = useTranslation();
  const { meta, login, to, source, readOnly, notifyCommit } = useApp();
  const labels = useLabels(meta);
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const year = params.get("ano") ?? "";
  if (!meta) return null;
  const unit = labels.units.find((u) => u.key === props.unitKey);
  const docs = meta.documents({
    owner: login,
    unit: props.unitKey,
    filedOnly: true,
    academicYear: year || undefined,
  });
  const byType = new Map<string, DocumentRow[]>();
  for (const doc of docs) {
    const key = doc.document_type ?? "outros";
    byType.set(key, [...(byType.get(key) ?? []), doc]);
  }
  const typeOrder = labels.vocab.document_types.map((v) => v.slug);
  const color = unitColor(props.unitKey);
  const unitName = unit?.acronym ?? unit?.name ?? props.unitKey;
  const chosen = docs.filter((d) => selected.has(d.id));
  const select = (ids: string[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  async function download(list: DocumentRow[], name: string) {
    setError(null);
    setNotice(null);
    try {
      await downloadZip(source, list, labels, name, (done, total) =>
        setBusy(t("library.zipping", { done, total })),
      );
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  async function setVisibility(list: DocumentRow[], value: "public" | "private") {
    if (value === "public" && !window.confirm(t("visibility.confirm_text"))) return;
    setError(null);
    setBusy(t("common.saving"));
    try {
      await source.patchDocuments(
        list.map((d) => ({
          id: d.id,
          patch: (record) => {
            record.visibility = value;
          },
        })),
        `visibilidade: ${list.length} documento(s) → ${value}`,
      );
      notifyCommit();
      setSelected(new Set());
      setNotice(t("visibility.saved"));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <Link to={to("/biblioteca")} className="text-sm text-pen hover:underline">
        ← {t("library.back")}
      </Link>
      <div className="flex overflow-hidden rounded-2xl border border-line bg-sheet">
        <span className="w-4 shrink-0" style={{ backgroundColor: color }} />
        <div className="flex flex-1 flex-wrap items-end justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color }}>
              {unit?.acronym ?? unit?.code ?? ""}
            </p>
            <h1 className="font-serif text-3xl font-semibold text-ink">
              {unit?.name ?? props.unitKey}
            </h1>
            {unit?.lecturers.length ? (
              <p className="mt-1 text-sm text-muted">{unit.lecturers.join(", ")}</p>
            ) : null}
            <div className="mt-4">
              <UnitVisibility key={props.unitKey} unitKey={props.unitKey} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t("library.all_years")}
              className="rounded-full border border-line-strong bg-sheet px-3 py-1.5 text-sm"
              value={year}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set("ano", e.target.value);
                else next.delete("ano");
                setParams(next);
              }}
            >
              <option value="">{t("library.all_years")}</option>
              {meta.academicYears().map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            {docs.length > 0 && (
              <Button
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void download(docs, unitName)}
              >
                <IconDownload size={16} /> {t("library.download_all", { count: docs.length })}
              </Button>
            )}
          </div>
        </div>
      </div>
      {error ? <ErrorBox error={error} /> : null}
      {notice && <Notice>{notice}</Notice>}
      {docs.length === 0 && <Empty>{t("library.empty")}</Empty>}
      <div className="grid gap-4 lg:grid-cols-2">
        {[...byType.entries()]
          .sort(([a], [b]) => typeOrder.indexOf(a) - typeOrder.indexOf(b))
          .map(([type, list]) => {
            const sorted = [...list].sort(byRecency);
            const ids = sorted.map((d) => d.id);
            const all = ids.every((id) => selected.has(id));
            const label = labels.term("document_types", type);
            return (
              <Card
                key={type}
                title={
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--color-pen)]"
                      checked={all}
                      onChange={() => select(ids, !all)}
                      aria-label={t("library.select_type", { type: label })}
                    />
                    {label}
                    <span className="font-sans text-xs font-normal text-muted">{list.length}</span>
                  </span>
                }
                actions={
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-muted hover:bg-paper hover:text-pen"
                    title={t("library.download_type", { type: label })}
                    aria-label={t("library.download_type", { type: label })}
                    disabled={busy !== null}
                    onClick={() => void download(sorted, `${unitName} - ${label}`)}
                  >
                    <IconDownload size={16} />
                  </button>
                }
              >
                {!readOnly && (
                  <div className="-mt-2 mb-2 flex items-center gap-2 text-xs text-muted">
                    <span>{t("visibility.type_row")}</span>
                    <TypeVisibility unitKey={props.unitKey} documentType={type} />
                  </div>
                )}
                <div className="divide-y divide-line">
                  {sorted.map((doc) => (
                    <DocumentLink
                      key={doc.id}
                      doc={doc}
                      groupedByType
                      selected={selected.has(doc.id)}
                      onSelect={(on) => select([doc.id], on)}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
      </div>
      {(chosen.length > 0 || busy) && (
        <div className="leather fixed inset-x-0 bottom-0 z-20 border-t border-gold/40 px-4 py-3 text-white lg:left-[17rem]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <span className="flex-1 text-sm">
              {busy ?? t("library.selected", { count: chosen.length })}
            </span>
            {chosen.length > 0 && !busy && (
              <>
                <Button onClick={() => void download(chosen, `${unitName} - selecção`)}>
                  <IconDownload size={16} /> {t("library.download_selected")}
                </Button>
                {!readOnly && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => void setVisibility(chosen, "public")}
                    >
                      <IconGlobe size={15} /> {t("library.make_public")}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void setVisibility(chosen, "private")}
                    >
                      <IconLock size={15} /> {t("library.make_private")}
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={() => setSelected(new Set())}>
                  <span className="text-gold-light">{t("library.clear_selection")}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LibraryPage() {
  const { t } = useTranslation();
  const { meta, login, indexLoading, indexError, to } = useApp();
  const labels = useLabels(meta);
  const [params] = useSearchParams();
  const selectedUnit = params.get("uc") ?? "";

  const shelves = useMemo(() => {
    if (!meta) return [];
    const stats = meta.unitStats(login);
    const links = meta.courseUnits();
    const unitMap = new Map(labels.units.map((u) => [u.key, u]));
    const shelves = meta.courses().map((course) => ({
      key: course.key,
      name: course.name,
      books: links
        .filter((l) => l.course_key === course.key && unitMap.has(l.unit_key))
        .map((l) => ({
          unit: unitMap.get(l.unit_key)!,
          count: stats.get(l.unit_key)?.filed ?? 0,
          subtitle: [
            l.curricular_year ? t("library.year_group", { year: l.curricular_year }) : null,
            l.semester ? t("library.semester", { semester: l.semester }) : null,
          ]
            .filter(Boolean)
            .join(", "),
        })),
    }));
    const linked = new Set(links.map((l) => l.unit_key));
    const loose = labels.units
      .filter((u) => !linked.has(u.key))
      .map((u) => ({ unit: u, count: stats.get(u.key)?.filed ?? 0, subtitle: "" }));
    if (loose.length) shelves.push({ key: "", name: t("library.no_course"), books: loose });
    return shelves;
  }, [meta, login, labels.units, t]);

  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;
  if (selectedUnit) return <UnitDetail unitKey={selectedUnit} />;

  const unfiled = meta.unfiled(login);
  return (
    <div className="space-y-8">
      <PageHeader title={t("library.title")} />
      {unfiled.length > 0 && (
        <Link
          to={to("/rever")}
          className="block rounded-2xl border border-marker/60 bg-marker-soft px-5 py-4 text-sm text-ink"
        >
          <strong>{t("library.unfiled")}</strong> ({unfiled.length}): {t("library.unfiled_help")}
        </Link>
      )}
      {shelves.length === 0 && <Empty>{t("library.empty")}</Empty>}
      {shelves.map((shelf) => (
        <section key={shelf.key || "loose"}>
          <h2 className="mb-3 font-serif text-xl font-semibold text-ink">{shelf.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.books.map((book) => (
              <UnitBook
                key={book.unit.key}
                unit={book.unit}
                count={book.count}
                subtitle={book.subtitle}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
