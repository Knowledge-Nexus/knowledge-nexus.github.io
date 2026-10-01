// Confirmar vários documentos de uma vez: cada campo "mantém a sugestão de cada um" ou
// aplica o mesmo valor a todos. Grava tudo num só commit (método "user", como um a um).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconStack } from "../../components/icons";
import { Button, Card, ErrorBox } from "../../components/ui";
import { useApp } from "../../data/context";
import type { ClassificationField, DocumentRow } from "../../data/types";
import { joinBundle, suggestBundleName } from "../../lib/bundles";
import { academicYears, FIELD_VOCAB, type Labels } from "../../lib/labels";
import { applyCorrection, type Draft, EDITABLE, initialDraft } from "./ReviewForm";

const ASSESSMENT_ONLY: ClassificationField[] = [
  "assessment_type",
  "exam_season",
  "assessment_number",
];

/** Rascunho final de um documento: a sua sugestão, com os valores comuns por cima. */
export function bulkDraft(doc: DocumentRow, common: Draft, labels: Labels): Draft {
  const draft: Draft = { ...initialDraft(doc) };
  for (const [field, value] of Object.entries(common) as [ClassificationField, string][]) {
    if (value) draft[field] = value;
  }
  const type = labels.vocab.document_types.find((d) => d.slug === draft.document_type);
  const out: Draft = {};
  for (const field of EDITABLE) {
    if (ASSESSMENT_ONLY.includes(field) && !type?.is_assessment) continue;
    if (field === "solution_origin" && draft.role !== "solution") continue;
    if (draft[field] !== undefined) out[field] = draft[field];
  }
  return out;
}

export function BulkReview(props: { docs: DocumentRow[]; labels: Labels; onDone?: () => void }) {
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
      <ul className="mb-4 max-h-40 space-y-0.5 overflow-auto rounded-xl bg-paper p-2 text-xs">
        {docs.map((d) => (
          <li key={d.id} className="truncate">
            {d.source_path ?? d.display_name}
          </li>
        ))}
      </ul>
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
          </label>
        ))}
      </div>
      {missing > 0 && (
        <p className="mt-3 text-xs text-clay">
          {t("review.bulk_missing_unit", { count: missing })}
        </p>
      )}
      {error ? <ErrorBox error={error} /> : null}
      <div className="mt-4">
        <Button onClick={() => void confirm()} disabled={busy || missing > 0}>
          {t("review.bulk_confirm", { count: docs.length })}
        </Button>
        <Button variant="secondary" onClick={() => void join()} disabled={busy}>
          <IconStack size={15} /> {t("bundle.join")}
        </Button>
      </div>
    </Card>
  );
}
