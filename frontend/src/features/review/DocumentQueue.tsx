// «A rever» → Documentos: a lista (com filtros e agrupada pelo tipo sugerido, com a cor de
// cada tipo), o documento ao centro e a classificação à direita, tudo à altura do ecrã para
// não ser preciso descer a página. Teclado: ↑/↓ outro documento, Enter confirma, Del remove.

import type { TFunction } from "i18next";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { BundleEditor } from "../../components/BundleEditor";
import { DocumentPreview } from "../../components/DocumentViewer";
import { FileBadge } from "../../components/FileBadge";
import { ConfidenceBadge, Empty, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow, ProposalRow, Reason } from "../../data/types";
import type { Labels } from "../../lib/labels";
import { normalize } from "../../lib/normalize";
import { originalName } from "../../lib/titles";
import { typeColor } from "../../lib/typeColors";
import { TitleEditor } from "../document/DocumentFields";
import { BulkReview } from "./BulkReview";
import { type Removal, RemoveButton } from "./RemoveDocuments";
import { isEditing, ReviewForm } from "./ReviewForm";

const NO_TYPE = "_sem_tipo";
/** Motivo que diz que a cadeira do documento é uma proposta ainda por criar. */
export const UNIT_PROPOSED = "review.unit_proposed";

/** Um motivo como filtro: o código e o campo («falta: cadeira» ≠ «falta: tipo»). */
const reasonKey = (r: Reason) =>
  `${r.code}:${typeof r.params?.field === "string" ? r.params.field : ""}`;

/** O nome que o dono deu ao documento (`classification.title`), se lho deu. */
const userTitle = (doc: DocumentRow) => {
  const value = doc.classification.title?.value;
  return typeof value === "string" && value.trim() ? value : null;
};

/** A proposta de cadeira de que o documento está à espera, se houver. */
export function proposalOf(doc: DocumentRow): string | null {
  const reason = doc.review_reasons.find((r) => r.code === UNIT_PROPOSED);
  return typeof reason?.params?.proposal === "string" ? reason.params.proposal : null;
}

export function DocumentQueue(props: {
  /** O que está por rever (já sem os que acabaste de remover), com os conjuntos. */
  queue: DocumentRow[];
  followers: Map<string, DocumentRow[]>;
  proposals: ProposalRow[];
  labels: Labels;
  onRemoved: (removal: Removal, next: string | null) => void;
  onCatalog: () => void;
}) {
  const { t } = useTranslation();
  const { meta, can } = useApp();
  const { labels, followers } = props;
  const [params, setParams] = useSearchParams();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  // Os que confirmaste saem logo da lista (antes de o índice ser reconstruído).
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  // A última confirmação (fica à vista enquanto a lista segue para o documento seguinte).
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);

  const types = labels.vocab.document_types;
  const queue = props.queue.filter((d) => !confirmed.has(d.id));
  const typeOf = (d: DocumentRow) => String(d.classification.document_type?.value ?? "") || NO_TYPE;

  // Filtros: pelo nome, pelo tipo sugerido e pelo motivo.
  const words = normalize(text).split(" ").filter(Boolean);
  const reasons = new Map<string, { reason: Reason; count: number }>();
  for (const doc of queue)
    for (const r of doc.review_reasons) {
      const key = reasonKey(r);
      const seen = reasons.get(key);
      if (seen) seen.count += 1;
      else reasons.set(key, { reason: r, count: 1 });
    }
  const shown = queue.filter((d) => {
    if (type && typeOf(d) !== type) return false;
    if (reason && !d.review_reasons.some((r) => reasonKey(r) === reason)) return false;
    if (words.length) {
      const name = normalize(`${d.source_path ?? ""} ${d.display_name}`);
      if (!words.every((w) => name.includes(w))) return false;
    }
    return true;
  });

  // Grupos pelo tipo sugerido, pela ordem do vocabulário; os sem tipo no fim.
  const order = [...types.map((term) => term.slug), NO_TYPE];
  const groups = order
    .map((slug) => ({
      slug,
      label: slug === NO_TYPE ? t("review.no_type") : labels.term("document_types", slug),
      color: typeColor(types, slug === NO_TYPE ? null : slug),
      docs: shown.filter((d) => typeOf(d) === slug),
    }))
    .filter((g) => g.docs.length > 0);
  const ordered = groups.flatMap((g) => g.docs);
  const wanted = params.get("doc");
  const selected =
    ordered.find((d) => d.id === wanted) ?? queue.find((d) => d.id === wanted) ?? ordered[0];
  const bulk = queue.filter((d) => checked.has(d.id));
  const proposalName = new Map(props.proposals.map((p) => [p.id, p.name]));
  const waiting = queue.filter((d) => proposalOf(d)).length;

  const select = (id: string | undefined) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id) next.set("doc", id);
        else next.delete("doc");
        return next;
      },
      { replace: true },
    );
  /** O seguinte da lista (ou o anterior, se era o último), sem os que já saíram. */
  const neighbour = (from: string | undefined, gone: Set<string>, step = 1) => {
    const at = ordered.findIndex((d) => d.id === from);
    const after = ordered.slice(at + 1).find((d) => !gone.has(d.id));
    const before = ordered
      .slice(0, Math.max(0, at))
      .reverse()
      .find((d) => !gone.has(d.id));
    return step > 0 ? (after ?? before) : (before ?? after);
  };

  // ↑/↓ mudam de documento; Del remove (abre a confirmação).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditing(event.target)) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const at = ordered.findIndex((d) => d.id === selected?.id);
        const next = ordered[at + (event.key === "ArrowDown" ? 1 : -1)];
        if (next) {
          event.preventDefault();
          select(next.id);
          document.getElementById(`review-item-${next.id}`)?.focus();
        }
      } else if (event.key === "Delete") {
        document.querySelector<HTMLButtonElement>("[data-remove-current] button")?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggle = (ids: string[], on: boolean) =>
    setChecked((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  function afterConfirm(doc: DocumentRow) {
    const gone = new Set([...confirmed, doc.id]);
    setConfirmed(gone);
    setLastConfirmed(`${t("review.confirmed")} ${originalName(doc)}`);
    select(neighbour(doc.id, gone)?.id);
  }

  function afterRemoval(removal: Removal) {
    setChecked(new Set());
    const gone = new Set(removal.ids);
    props.onRemoved(removal, neighbour(selected?.id, gone)?.id ?? null);
  }

  const secondary = (doc: DocumentRow): ReactNode => {
    const unit = doc.classification.unit;
    const proposal = proposalOf(doc);
    const name = unit?.value
      ? labels.unit(String(unit.value))
      : proposal
        ? t("review.unit_missing_name", { name: proposalName.get(proposal) ?? proposal })
        : t("library.no_unit");
    return (
      <>
        <span className="truncate">{name}</span>
        {unit?.value ? <ConfidenceBadge field={unit} compact /> : null}
      </>
    );
  };

  if (queue.length === 0)
    return (
      <div className="space-y-3">
        {lastConfirmed && <Notice>✓ {lastConfirmed}</Notice>}
        <Empty>{t("review.empty")}</Empty>
      </div>
    );

  const height = waiting > 0 ? "lg:h-[calc(100dvh-17.5rem)]" : "lg:h-[calc(100dvh-14rem)]";
  const field =
    "w-full rounded-xl border border-line-strong bg-white px-2.5 py-1.5 text-sm text-ink";
  return (
    <div className="space-y-3">
      {waiting > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-marker/60 bg-marker-soft px-4 py-2 text-sm">
          <span className="flex-1">{t("review.waiting_banner", { count: waiting })}</span>
          <button
            type="button"
            className="font-semibold text-pen hover:underline"
            onClick={props.onCatalog}
          >
            {t("review.waiting_go")} →
          </button>
        </div>
      )}
      {lastConfirmed && (
        <p className="text-sm text-sage" role="status">
          ✓ {lastConfirmed} {t("common.pending_sync")}
        </p>
      )}
      <div
        className={`grid gap-3 lg:min-h-[34rem] lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] ${height}`}
      >
        {/* A lista */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-sheet max-lg:max-h-[45vh]">
          <div className="grid gap-2 border-b border-line p-2.5">
            <input
              className={field}
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("review.search")}
              aria-label={t("review.search")}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className={field}
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label={t("review.filter_type")}
              >
                <option value="">{t("review.all_types", { count: queue.length })}</option>
                {order.map((slug) => {
                  const count = queue.filter((d) => typeOf(d) === slug).length;
                  return count ? (
                    <option key={slug} value={slug}>
                      {slug === NO_TYPE ? t("review.no_type") : labels.term("document_types", slug)}{" "}
                      ({count})
                    </option>
                  ) : null;
                })}
              </select>
              <select
                className={field}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-label={t("review.filter_reason")}
              >
                <option value="">{t("review.all_reasons", { count: queue.length })}</option>
                {[...reasons.entries()]
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([key, { reason: r, count }]) => (
                    <option key={key} value={key}>
                      {/* o texto do motivo, sem marcação: as opções só aceitam texto */}
                      {reasonLabel(r, t)} ({count})
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {groups.length === 0 && (
              <p className="p-3 text-center text-sm text-muted">{t("review.no_match")}</p>
            )}
            {groups.map((group) => {
              const ids = group.docs.map((d) => d.id);
              const all = ids.every((id) => checked.has(id));
              return (
                <div key={group.slug} className="mb-2">
                  <label className="flex items-center gap-2 px-1.5 py-1 text-[0.7rem] font-semibold tracking-wide text-ink-soft uppercase">
                    <input
                      type="checkbox"
                      checked={all}
                      onChange={() => toggle(ids, !all)}
                      aria-label={t("review.select_group", { label: group.label })}
                    />
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-1 shrink-0 rounded"
                      style={{ background: group.color }}
                    />
                    <span className="flex-1 truncate" title={group.label}>
                      {group.label}
                    </span>
                    <span className="font-medium text-muted">{group.docs.length}</span>
                  </label>
                  <ul className="space-y-0.5">
                    {group.docs.map((doc) => {
                      const active = doc.id === selected?.id && checked.size < 2;
                      return (
                        <li
                          key={doc.id}
                          className={`flex items-start gap-2 rounded-xl border-l-[3px] py-1 pr-1 pl-2 ${active ? "bg-pen text-white" : checked.has(doc.id) ? "bg-pen-soft" : "hover:bg-paper"}`}
                          style={{ borderLeftColor: group.color }}
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked.has(doc.id)}
                            onChange={() => toggle([doc.id], !checked.has(doc.id))}
                            aria-label={doc.source_path ?? doc.display_name}
                          />
                          <button
                            id={`review-item-${doc.id}`}
                            type="button"
                            data-shortcuts="true"
                            onClick={() => select(doc.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate text-sm font-medium">
                              {userTitle(doc) ?? originalName(doc)}
                            </span>
                            <span
                              className={`flex items-center gap-1.5 text-xs ${active ? "text-white/80" : "text-muted"}`}
                            >
                              {secondary(doc)}
                            </span>
                            {followers.has(doc.id) && (
                              <span
                                className={`block truncate text-xs ${active ? "text-white/80" : "text-muted"}`}
                              >
                                {t("bundle.followers", {
                                  count: followers.get(doc.id)?.length ?? 0,
                                  name: doc.bundle_name,
                                })}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {bulk.length >= 2 ? (
          <section className="min-h-0 overflow-y-auto">
            <BulkReview
              key={bulk
                .map((d) => d.id)
                .sort()
                .join(",")}
              docs={bulk}
              labels={labels}
              onDone={() => {
                setConfirmed(new Set([...confirmed, ...bulk.map((d) => d.id)]));
                setChecked(new Set());
                setLastConfirmed(t("review.bulk_done", { count: bulk.length }));
              }}
              actions={
                <RemoveButton
                  docs={bulk}
                  followers={bulk.flatMap((d) => followers.get(d.id) ?? [])}
                  onRemoved={afterRemoval}
                />
              }
            />
          </section>
        ) : selected ? (
          <div className="grid min-h-0 gap-3 max-xl:lg:overflow-y-auto xl:grid-cols-[minmax(0,1fr)_21rem] xl:grid-rows-[minmax(0,1fr)]">
            {/* O documento */}
            <section className="flex flex-col rounded-2xl border border-line bg-sheet max-xl:order-last xl:min-h-0 xl:overflow-hidden">
              <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
                <FileBadge ext={selected.ext} kind={selected.kind} />
                <TitleEditor
                  key={selected.id}
                  doc={selected}
                  title={userTitle(selected) ?? originalName(selected)}
                  canEdit={can.organize}
                  compact
                />
                <Link
                  className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium hover:bg-paper"
                  to={`/documento/${selected.id}`}
                >
                  {t("review.open_page")}
                </Link>
                {selected.status !== "removed" && (
                  <span data-remove-current className="contents">
                    <RemoveButton
                      key={selected.id}
                      docs={[selected]}
                      followers={followers.get(selected.id)}
                      onRemoved={afterRemoval}
                      compact
                    />
                  </span>
                )}
              </header>
              <div className="space-y-3 p-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                {selected.bundle_id && (
                  <Notice>
                    {t(
                      selected.bundle_lead === selected.id
                        ? "bundle.review_lead"
                        : "bundle.review_member",
                      {
                        name: selected.bundle_name,
                        count: meta?.bundleMembers(selected.bundle_id).length ?? 0,
                      },
                    )}
                  </Notice>
                )}
                {selected.bundle_id && <BundleEditor key={selected.id} doc={selected} />}
                <DocumentPreview key={selected.id} doc={selected} />
              </div>
            </section>
            {/* A classificação */}
            <section className="flex flex-col rounded-2xl border border-line bg-sheet xl:min-h-0 xl:overflow-hidden">
              <ReviewForm
                key={selected.id}
                doc={selected}
                labels={labels}
                onDone={() => afterConfirm(selected)}
                onSkip={() => select(neighbour(selected.id, new Set([selected.id]))?.id)}
              />
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** O texto de um motivo para uma `<option>` (que só aceita texto). */
function reasonLabel(reason: Reason, t: TFunction): string {
  const params: Record<string, unknown> = { ...reason.params };
  if (typeof params.field === "string") params.field = t(`fields.${params.field}`);
  return String(t(`reasons:${reason.code}`, { ...params, defaultValue: reason.code }));
}
