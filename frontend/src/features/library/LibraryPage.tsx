import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { FileBadge } from "../../components/FileBadge";
import {
  IconArrowRight,
  IconDownload,
  IconGlobe,
  IconLock,
  IconStack,
} from "../../components/icons";
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
import { joinBundle, separateBundle, suggestBundleName } from "../../lib/bundles";
import { downloadZip } from "../../lib/download";
import { useLabels } from "../../lib/labels";
import { documentDate, documentTitle, originalName } from "../../lib/titles";
import { Shelves } from "./Shelves";
import { UnitCourses } from "./UnitCourses";

const DOC_DRAG = "application/x-nexus-docs";

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
export function UnitBook(props: {
  unit: UnitRow;
  count: number;
  subtitle?: string;
  /** Versão pequena, para as estantes (mais cadeiras por linha). */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { meta, login, to, readOnly } = useApp();
  const { unit, compact } = props;
  const color = unitColor(unit.key);
  const shared = !readOnly && isPublic(meta?.unitVisibility(login)[unit.key]);
  return (
    <Link
      to={to(`/biblioteca?uc=${encodeURIComponent(unit.key)}`)}
      title={unit.name}
      className={`group relative flex h-full overflow-hidden border border-line bg-sheet transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(29,39,51,0.45)] ${compact ? "rounded-xl" : "rounded-2xl"}`}
    >
      <span
        className={`shrink-0 ${compact ? "w-1.5" : "w-3"}`}
        style={{ backgroundColor: color }}
      />
      <span
        className={`flex min-w-0 flex-1 flex-col ${compact ? "gap-0.5 px-3 py-2" : "gap-1 px-4 py-4"}`}
      >
        <span
          className={`flex items-center gap-1.5 font-semibold tracking-wider uppercase ${compact ? "text-[11px]" : "text-xs"}`}
          style={{ color }}
        >
          {unit.acronym ?? unit.code ?? unit.slug}
          {shared && (
            <span className="text-pen" title={t("visibility.badge")}>
              <IconGlobe size={compact ? 11 : 13} />
              <span className="sr-only">{t("visibility.badge")}</span>
            </span>
          )}
        </span>
        <span
          className={`font-serif leading-snug font-semibold text-ink ${compact ? "line-clamp-2 text-[0.95rem]" : "text-lg"}`}
        >
          {unit.name}
        </span>
        <span className={`text-muted ${compact ? "text-[11px]" : "mt-1 text-xs"}`}>
          {props.subtitle ? `${props.subtitle} · ` : ""}
          {t("library.documents", { count: props.count })}
        </span>
      </span>
      {!compact && (
        <span className="self-center pr-4 text-line-strong transition group-hover:text-pen">
          <IconArrowRight />
        </span>
      )}
    </Link>
  );
}

/** Um conjunto aparece como uma só entrada: o principal, com os outros por baixo. */
export function bundleEntries(docs: DocumentRow[]): { doc: DocumentRow; members: DocumentRow[] }[] {
  const groups = new Map<string, DocumentRow[]>();
  for (const doc of docs) {
    if (doc.bundle_id) groups.set(doc.bundle_id, [...(groups.get(doc.bundle_id) ?? []), doc]);
  }
  const out: { doc: DocumentRow; members: DocumentRow[] }[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    if (seen.has(doc.id)) continue;
    const group = doc.bundle_id ? (groups.get(doc.bundle_id) ?? []) : [];
    if (group.length > 1) {
      const lead = group.find((d) => d.id === d.bundle_lead) ?? group[0]!;
      out.push({ doc: lead, members: group.filter((d) => d.id !== lead.id) });
      for (const d of group) seen.add(d.id);
    } else {
      out.push({ doc, members: [] });
      seen.add(doc.id);
    }
  }
  return out;
}

/** Os outros ficheiros de um conjunto, por baixo do principal. */
export function BundleMembers(props: { lead: DocumentRow; members: DocumentRow[] }) {
  const { t } = useTranslation();
  const { to } = useApp();
  if (props.members.length === 0) return null;
  return (
    <div className="mb-2 ml-11 border-l-2 border-gold/50 pl-3">
      <p className="flex items-center gap-1 text-xs text-muted">
        <IconStack size={13} />
        {t("bundle.label", { name: props.lead.bundle_name, count: props.members.length + 1 })}
      </p>
      <ul className="mt-1 space-y-0.5">
        {props.members.map((m) => (
          <li key={m.id}>
            <Link
              to={to(`/documento/${m.id}`)}
              className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-ink-soft hover:bg-paper hover:text-pen"
              title={m.display_name}
            >
              <span className="scale-75">
                <FileBadge ext={m.ext} kind={m.kind} />
              </span>
              <span className="truncate">{originalName(m)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
  const [dropType, setDropType] = useState<string | null>(null);
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

  async function bundle(list: DocumentRow[], action: "join" | "separate") {
    let name = "";
    if (action === "join") {
      name = window.prompt(t("bundle.name_prompt"), suggestBundleName(list))?.trim() ?? "";
      if (!name) return;
    }
    setError(null);
    setBusy(t("common.saving"));
    try {
      if (action === "join") await joinBundle(source, list, name);
      else await separateBundle(source, list);
      notifyCommit();
      setSelected(new Set());
      setNotice(t(action === "join" ? "bundle.joined" : "bundle.separated"));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  /** Arrastar documentos para outro cartão muda o tipo (fica definido por ti). */
  async function changeType(ids: string[], type: string) {
    const list = docs.filter((d) => ids.includes(d.id) && d.document_type !== type);
    if (list.length === 0) return;
    setError(null);
    setBusy(t("common.saving"));
    try {
      await source.patchDocuments(
        list.map((d) => ({
          id: d.id,
          patch: (record) => {
            const classification = (record.classification as Record<string, unknown>) ?? {};
            classification.document_type = {
              value: type,
              confidence: 1,
              method: "user",
              reasons: [{ code: "user.set", params: { login } }],
            };
            record.classification = classification;
          },
        })),
        `tipo: ${list.length} documento(s) → ${type}`,
      );
      notifyCommit();
      setSelected(new Set());
      setNotice(t("library.type_changed", { type: labels.term("document_types", type) }));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  function dropOnType(event: DragEvent, type: string) {
    setDropType(null);
    const raw = event.dataTransfer.getData(DOC_DRAG);
    if (!raw) return;
    event.preventDefault();
    void changeType(JSON.parse(raw) as string[], type);
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
            {unit && (
              <div className="mt-3">
                <UnitCourses key={props.unitKey} unit={unit} />
              </div>
            )}
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
      {!readOnly && byType.size > 1 && (
        <p className="-mb-2 text-xs text-muted">{t("library.drag_type_hint")}</p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,28rem),1fr))] gap-4">
        {[...byType.entries()]
          .sort(([a], [b]) => typeOrder.indexOf(a) - typeOrder.indexOf(b))
          .map(([type, list]) => {
            const sorted = [...list].sort(byRecency);
            const ids = sorted.map((d) => d.id);
            const all = ids.every((id) => selected.has(id));
            const label = labels.term("document_types", type);
            return (
              // biome-ignore lint/a11y/useSemanticElements: zona de largar, não um formulário
              <div
                key={type}
                role="group"
                aria-label={label}
                onDragOver={(e) => {
                  if (readOnly || !e.dataTransfer.types.includes(DOC_DRAG)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropType(type);
                }}
                onDragLeave={() => setDropType((h) => (h === type ? null : h))}
                onDrop={(e) => dropOnType(e, type)}
                className={`rounded-2xl transition ${dropType === type ? "ring-2 ring-gold ring-offset-4 ring-offset-paper" : ""}`}
              >
                <Card
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
                      <span className="font-sans text-xs font-normal text-muted">
                        {list.length}
                      </span>
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
                    {bundleEntries(sorted).map(({ doc, members }) => {
                      const ids = [doc.id, ...members.map((m) => m.id)];
                      return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: o documento arrasta-se para outro tipo
                        <div
                          key={doc.id}
                          draggable={!readOnly}
                          onDragStart={(e) => {
                            const moving = ids.some((id) => selected.has(id))
                              ? [...new Set([...selected, ...ids])]
                              : ids;
                            e.dataTransfer.setData(DOC_DRAG, JSON.stringify(moving));
                            e.dataTransfer.effectAllowed = "all";
                          }}
                        >
                          <DocumentLink
                            doc={doc}
                            groupedByType
                            selected={ids.every((id) => selected.has(id))}
                            onSelect={(on) => select(ids, on)}
                          />
                          <BundleMembers lead={doc} members={members} />
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
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
                {!readOnly && chosen.length >= 2 && (
                  <Button variant="secondary" onClick={() => void bundle(chosen, "join")}>
                    <IconStack size={15} /> {t("bundle.join")}
                  </Button>
                )}
                {!readOnly && chosen.some((d) => d.bundle_id) && (
                  <Button variant="secondary" onClick={() => void bundle(chosen, "separate")}>
                    {t("bundle.separate")}
                  </Button>
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
  const { meta, login, indexLoading, indexError, to, readOnly } = useApp();
  const labels = useLabels(meta);
  const [params] = useSearchParams();
  const [organizing, setOrganizing] = useState(false);
  const selectedUnit = params.get("uc") ?? "";

  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;
  if (selectedUnit) return <UnitDetail unitKey={selectedUnit} />;

  const unfiled = meta.unfiled(login);
  return (
    <div className="space-y-8">
      <PageHeader
        title={t("library.title")}
        actions={
          !readOnly && labels.units.length > 0 ? (
            <Button variant="secondary" onClick={() => setOrganizing((v) => !v)}>
              {t(organizing ? "courses.organize_close" : "courses.organize")}
            </Button>
          ) : undefined
        }
      />
      {organizing && (
        <Card title={t("courses.organize_title")}>
          <p className="mb-3 text-sm text-ink-soft">{t("courses.organize_help")}</p>
          <ul className="divide-y divide-line">
            {labels.units.map((unit) => (
              <li key={unit.key} className="py-3">
                <p className="mb-1 font-serif font-semibold text-ink">
                  {unit.acronym ? `${unit.acronym} · ` : ""}
                  {unit.name}
                </p>
                <UnitCourses unit={unit} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      {unfiled.length > 0 && (
        <Link
          to={to("/rever")}
          className="block rounded-2xl border border-marker/60 bg-marker-soft px-5 py-4 text-sm text-ink"
        >
          <strong>{t("library.unfiled")}</strong> ({unfiled.length}): {t("library.unfiled_help")}
        </Link>
      )}
      {labels.units.length === 0 && <Empty>{t("library.empty")}</Empty>}
      <Shelves units={labels.units} />
    </div>
  );
}
