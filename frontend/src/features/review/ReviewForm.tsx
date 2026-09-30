// Formulário de correcção/confirmação da classificação. Grava um patch por campo
// (método "user"); o pipeline nunca sobrepõe estes campos e arruma o documento.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ConfidenceBadge, ErrorBox, ReasonList } from "../../components/ui";
import { useApp } from "../../data/context";
import { nowIso } from "../../data/source";
import type { ClassificationField, DocumentRow } from "../../data/types";
import { academicYears, FIELD_VOCAB, type Labels } from "../../lib/labels";

const EDITABLE: ClassificationField[] = [
  "unit",
  "document_type",
  "academic_year",
  "assessment_type",
  "exam_season",
  "assessment_number",
  "role",
  "solution_origin",
];

type Draft = Partial<Record<ClassificationField, string>>;

export function initialDraft(doc: DocumentRow): Draft {
  const draft: Draft = {};
  for (const field of EDITABLE) {
    const value = doc.classification[field]?.value;
    if (value !== null && value !== undefined) draft[field] = String(value);
  }
  return draft;
}

/** Aplica a correcção ao registo YAML do documento (mesma forma que o Pydantic espera). */
export function applyCorrection(record: Record<string, unknown>, draft: Draft, login: string) {
  const classification = (record.classification as Record<string, unknown> | undefined) ?? {};
  for (const field of EDITABLE) {
    const raw = draft[field];
    if (raw === undefined || raw === "") {
      delete classification[field];
      continue;
    }
    const value = field === "assessment_number" ? Number(raw) : raw;
    classification[field] = {
      value,
      confidence: 1,
      method: "user",
      reasons: [{ code: "user.set", params: { login } }],
    };
  }
  record.classification = classification;
  const review = (record.review as Record<string, unknown> | undefined) ?? {
    status: "open",
    reasons: [],
  };
  record.review = { ...review, status: "resolved", resolved_at: nowIso(), resolved_by: login };
}

export function ReviewForm(props: { doc: DocumentRow; labels: Labels; onDone?: () => void }) {
  const { t } = useTranslation();
  const { source, login, notifyCommit } = useApp();
  const { doc, labels } = props;
  const [draft, setDraft] = useState<Draft>(() => initialDraft(doc));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);

  const typeTerm = labels.vocab.document_types.find((d) => d.slug === draft.document_type);
  const isAssessment = Boolean(typeTerm?.is_assessment);
  const visible = EDITABLE.filter((field) => {
    if (["assessment_type", "exam_season", "assessment_number"].includes(field))
      return isAssessment;
    if (field === "solution_origin") return draft.role === "solution";
    return true;
  });

  const set = (field: ClassificationField, value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const options = (field: ClassificationField): { value: string; label: string }[] => {
    if (field === "unit")
      return labels.units.map((u) => ({ value: u.key, label: labels.unit(u.key) }));
    if (field === "academic_year")
      return academicYears(draft.academic_year ? [draft.academic_year] : []).map((y) => ({
        value: y,
        label: y,
      }));
    const kind = FIELD_VOCAB[field];
    return kind ? labels.vocab[kind].map((v) => ({ value: v.slug, label: v.label })) : [];
  };

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const chosen: Draft = Object.fromEntries(visible.map((f) => [f, draft[f]]));
      await source.patchDocument(
        doc.id,
        (record) => applyCorrection(record, chosen, login),
        `revisão: ${doc.display_name}`,
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

  if (done)
    return (
      <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        ✓ {t("review.confirmed")} {t("common.pending_sync")}
      </p>
    );

  return (
    <div className="space-y-4">
      {visible.map((field) => {
        const current = doc.classification[field];
        const alternatives = current?.alternatives ?? [];
        const choices = options(field);
        return (
          <div key={field} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium" htmlFor={`field-${field}`}>
                {t(`fields.${field}`)}
              </label>
              <ConfidenceBadge field={current} />
            </div>
            {choices.length > 0 ? (
              <select
                id={`field-${field}`}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                value={draft[field] ?? ""}
                onChange={(e) => set(field, e.target.value)}
              >
                <option value="">{t("review.choose")}</option>
                {choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${field}`}
                type="number"
                min={1}
                className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                value={draft[field] ?? ""}
                onChange={(e) => set(field, e.target.value)}
              />
            )}
            {alternatives.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                <span className="text-slate-500">{t("review.alternatives")}:</span>
                {alternatives.map((alt) => (
                  <button
                    type="button"
                    key={String(alt.value)}
                    onClick={() => set(field, String(alt.value))}
                    className="rounded-full border border-slate-300 px-2 py-0.5 hover:bg-slate-100"
                  >
                    {labels.value(field, alt.value)} · {Math.round(alt.confidence * 100)}%
                  </button>
                ))}
              </div>
            )}
            <ReasonList reasons={current?.reasons} />
          </div>
        );
      })}
      {error ? <ErrorBox error={error} /> : null}
      <Button onClick={confirm} disabled={busy || !draft.unit || !draft.document_type}>
        {busy ? t("common.saving") : t("review.confirm")}
      </Button>
    </div>
  );
}
