// Confirmar vários documentos de uma vez: cada campo "mantém a sugestão de cada um" ou
// aplica o mesmo valor a todos. Grava tudo num só commit (método "user", como um a um).

import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconStack } from "../../components/icons";
import { Button, Card, ConfidenceBadge, ErrorBox } from "../../components/ui";
import { useApp } from "../../data/context";
import type { ClassificationField, DocumentRow } from "../../data/types";
import { joinBundle, suggestBundleName } from "../../lib/bundles";
import { academicYears, FIELD_VOCAB, type Labels } from "../../lib/labels";
import { originalName } from "../../lib/titles";
import { applyCorrection, type Draft, EDITABLE, initialDraft } from "./ReviewForm";

const ASSESSMENT_ONLY: ClassificationField[] = [
  "assessment_type",
  "exam_season",
  "assessment_number",
];

/** A sugestão do documento, com os valores escolhidos para todos por cima. */
function merged(doc: DocumentRow, common: Draft): Draft {
  const draft: Draft = { ...initialDraft(doc) };
  for (const [field, value] of Object.entries(common) as [ClassificationField, string][]) {
    if (value) draft[field] = value;
  }
  return draft;
}

/** O campo conta para o documento: a avaliação só nas avaliações, a origem nas resoluções. */
function applies(field: ClassificationField, draft: Draft, labels: Labels): boolean {
  const type = labels.vocab.document_types.find((d) => d.slug === draft.document_type);
  if (ASSESSMENT_ONLY.includes(field)) return Boolean(type?.is_assessment);
  if (field === "solution_origin") return draft.role === "solution";
  return true;
}

/** Rascunho final de um documento: a sua sugestão, com os valores comuns por cima. */
export function bulkDraft(doc: DocumentRow, common: Draft, labels: Labels): Draft {
  const draft = merged(doc, common);
  const out: Draft = {};
  for (const field of EDITABLE) {
    if (applies(field, draft, labels) && draft[field] !== undefined) out[field] = draft[field];
  }
  return out;
}

/**
 * O valor que fica num campo de um documento: a sugestão dele ou o escolhido para todos;
 * `null` se o campo não se aplica, `undefined` se não há sugestão.
 */
export function bulkValue(
  doc: DocumentRow,
  field: ClassificationField,
  common: Draft,
  labels: Labels,
): string | null | undefined {
  const draft = merged(doc, common);
  return applies(field, draft, labels) ? draft[field] || undefined : null;
}

/** O que os documentos sugerem num campo, agrupado: "POO (2), sem sugestão (1)". */
export function suggestionSummary(
  docs: DocumentRow[],
  field: ClassificationField,
  common: Draft,
  labels: Labels,
): { value: string | null | undefined; count: number }[] {
  const counts = new Map<string | null | undefined, number>();
  for (const doc of docs) {
    const value = bulkValue(doc, field, { ...common, [field]: "" }, labels);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function BulkReview(props: {
  docs: DocumentRow[];
  labels: Labels;
  onDone?: () => void;
  /** Outros botões, ao lado de «Confirmar» (ex.: remover). */
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { source, login, notifyCommit } = useApp();
  const { docs, labels } = props;
  const [common, setCommon] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const [joined, setJoined] = useState(false);

  const fields: ClassificationField[] = [
    "unit",
    "document_type",
    "academic_year",
    "assessment_type",
    "exam_season",
    "role",
  ];
  const options = (field: ClassificationField) => {
    if (field === "unit")
      return labels.units.map((u) => ({ value: u.key, label: labels.unit(u.key) }));
    if (field === "academic_year") return academicYears([]).map((y) => ({ value: y, label: y }));
    const kind = FIELD_VOCAB[field];
    return kind ? labels.vocab[kind].map((v) => ({ value: v.slug, label: v.label })) : [];
  };
  const missing = docs.filter((d) => !bulkDraft(d, common, labels).unit).length;
  // Na tabela, só os campos que contam para algum documento (sem colunas de «não se aplica»).
  const columns = fields.filter((field) =>
    docs.some((doc) => bulkValue(doc, field, common, labels) !== null),
  );
  const valueLabel = (field: ClassificationField, value: string | null | undefined) =>
    value === null
      ? t("review.bulk_not_applicable")
      : value === undefined
        ? t("review.bulk_no_suggestion")
        : labels.value(field, value);

  /** Juntar num conjunto: confirmas só o principal e os outros vão com ele. */
  async function join() {
    const name = window.prompt(t("bundle.name_prompt"), suggestBundleName(docs))?.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await joinBundle(source, docs, name);
      notifyCommit();
      setJoined(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await source.patchDocuments(
        docs.map((doc) => ({
          id: doc.id,
          patch: (record) => applyCorrection(record, bulkDraft(doc, common, labels), login),
        })),
        `revisão: ${docs.length} documento(s)`,
      );
      notifyCommit();
      setDone(true);
      props.onDone?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (joined)
    return (
      <Card>
        <p className="text-sm text-sage">
          ✓ {t("bundle.joined")} {t("common.pending_sync")}
        </p>
      </Card>
    );
  if (done)
    return (
      <Card>
        <p className="text-sm text-sage">
          ✓ {t("review.bulk_done", { count: docs.length })} {t("common.pending_sync")}
        </p>
      </Card>
    );

  return (
    <Card title={t("review.bulk_title", { count: docs.length })}>
      <p className="mb-4 text-sm text-ink-soft">{t("review.bulk_intro")}</p>
      {/* O que fica em cada documento: a sugestão dele ou o valor escolhido para todos. */}
      <div className="mb-4 max-h-80 overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[40rem] text-left text-xs">
          <caption className="sr-only">{t("review.bulk_table")}</caption>
          <thead className="sticky top-0 bg-paper text-muted">
            <tr>
              <th scope="col" className="px-2 py-1.5 font-medium">
                {t("review.bulk_document")}
              </th>
              {columns.map((field) => (
                <th key={field} scope="col" className="px-2 py-1.5 font-medium">
                  {t(`fields.${field}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((doc) => {
              return (
                <tr key={doc.id} className="align-top">
                  <th
                    scope="row"
                    className="max-w-56 truncate px-2 py-1.5 font-medium text-ink"
                    title={doc.source_path ?? doc.display_name}
                  >
                    {originalName(doc)}
                  </th>
                  {columns.map((field) => {
                    const chosen = Boolean(common[field]);
                    const value = bulkValue(doc, field, common, labels);
                    const empty = value === undefined;
                    return (
                      <td
                        key={field}
                        className={`px-2 py-1.5 ${field === "academic_year" ? "whitespace-nowrap" : ""}`}
                      >
                        <span
                          className={`inline-flex flex-wrap items-center gap-x-1.5 ${
                            value === null
                              ? "text-muted"
                              : empty
                                ? field === "unit"
                                  ? "text-clay"
                                  : "text-muted"
                                : chosen
                                  ? "font-medium text-pen"
                                  : "text-ink"
                          }`}
                          title={chosen ? t("review.bulk_chosen") : undefined}
                        >
                          {valueLabel(field, value)}
                          {!chosen && !empty && value !== null && (
                            <ConfidenceBadge field={doc.classification[field]} compact />
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="block text-sm">
            <span className="font-medium">{t(`fields.${field}`)}</span>
            <select
              aria-label={t(`fields.${field}`)}
              className="mt-1 w-full rounded-xl border border-line-strong bg-sheet px-2 py-1.5"
              value={common[field] ?? ""}
              onChange={(e) => setCommon((c) => ({ ...c, [field]: e.target.value }))}
            >
              <option value="">{t("review.bulk_keep")}</option>
              {options(field).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {!common[field] && (
              <span className="mt-1 block text-xs text-muted">
                {t("review.bulk_suggested")}{" "}
                {suggestionSummary(docs, field, common, labels)
                  .map(({ value, count }) => `${valueLabel(field, value)} (${count})`)
                  .join(", ")}
              </span>
            )}
          </label>
        ))}
      </div>
      {missing > 0 && (
        <p className="mt-3 text-xs text-clay">
          {t("review.bulk_missing_unit", { count: missing })}
        </p>
      )}
      {error ? <ErrorBox error={error} /> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => void confirm()} disabled={busy || missing > 0}>
          {t("review.bulk_confirm", { count: docs.length })}
        </Button>
        <Button variant="secondary" onClick={() => void join()} disabled={busy}>
          <IconStack size={15} /> {t("bundle.join")}
        </Button>
        {props.actions}
      </div>
    </Card>
  );
}
