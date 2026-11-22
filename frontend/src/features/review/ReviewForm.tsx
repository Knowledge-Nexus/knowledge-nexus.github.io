// Formulário de correcção/confirmação da classificação. Grava um patch por campo
// (método "user"); o pipeline nunca sobrepõe estes campos e arruma o documento.

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  buttonClass,
  ConfidenceBadge,
  ErrorBox,
  ReasonList,
  ReasonText,
} from "../../components/ui";
import { useApp } from "../../data/context";
import { nowIso } from "../../data/source";
import type { ClassificationField, DocumentRow } from "../../data/types";
import { academicYears, FIELD_VOCAB, type Labels } from "../../lib/labels";
import { typeColor } from "../../lib/typeColors";

export const EDITABLE: ClassificationField[] = [
  "unit",
  "document_type",
  "academic_year",
  "assessment_type",
  "exam_season",
  "assessment_number",
  "role",
  "solution_origin",
];

export type Draft = Partial<Record<ClassificationField, string>>;

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

/** Um campo do formulário: o rótulo e a certeza, a escolha e as alternativas. */
function Field(props: {
  field: ClassificationField;
  doc: DocumentRow;
  labels: Labels;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
  color?: string;
}) {
  const { t } = useTranslation();
  const { field, doc, labels, value, choices } = props;
  const current = doc.classification[field];
  const alternatives = (current?.alternatives ?? []).filter((a) => String(a.value) !== value);
  const id = `field-${field}`;
  // Poucas opções (enunciado ou resolução): botões lado a lado, em vez de uma lista.
  const segmented = choices.length > 0 && choices.length <= 3 && field !== "unit";
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-ink-soft" htmlFor={id}>
          {t(`fields.${field}`)}
        </label>
        <ConfidenceBadge field={current} compact />
      </div>
      {segmented ? (
        <fieldset
          aria-label={t(`fields.${field}`)}
          className="m-0 flex min-w-0 overflow-hidden rounded-xl border border-line-strong p-0"
        >
          {choices.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={value === c.value}
              onClick={() => props.onChange(value === c.value ? "" : c.value)}
              className={`flex-1 px-2 py-1.5 text-sm ${value === c.value ? "bg-pen font-semibold text-white" : "bg-white hover:bg-paper"}`}
            >
              {c.label}
            </button>
          ))}
        </fieldset>
      ) : choices.length > 0 ? (
        <div className="relative">
          {props.color && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 h-2.5 w-2.5 -translate-y-1/2 rounded-[3px]"
              style={{ background: props.color }}
            />
          )}
          <select
            id={id}
            className={`w-full rounded-xl border border-line-strong bg-white py-1.5 pr-2 text-sm ${props.color ? "pl-7" : "pl-2"}`}
            value={value}
            onChange={(e) => props.onChange(e.target.value)}
          >
            <option value="">{t("review.choose")}</option>
            {choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input
          id={id}
          type="number"
          min={1}
          className="w-24 rounded-xl border border-line-strong bg-white px-2 py-1.5 text-sm"
          value={value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      {alternatives.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted">{t("review.alternatives")}:</span>
          {alternatives.map((alt) => (
            <button
              type="button"
              key={String(alt.value)}
              onClick={() => props.onChange(String(alt.value))}
              className="rounded-full border border-line-strong bg-white px-2 py-0.5 hover:bg-paper"
            >
              {labels.value(field, alt.value)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * O formulário de um documento em «A rever»: os motivos no topo, os campos dois a dois, o
 * «porquê» fechado e «Confirmar e arrumar» sempre à vista (com Enter, fora dos campos).
 */
export function ReviewForm(props: {
  doc: DocumentRow;
  labels: Labels;
  onDone?: () => void;
  onSkip?: () => void;
}) {
  const { t } = useTranslation();
  const { source, login, notifyCommit } = useApp();
  const { doc, labels } = props;
  const [draft, setDraft] = useState<Draft>(() => initialDraft(doc));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

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

  const ready = Boolean(draft.unit && draft.document_type) && !busy;
  async function confirm() {
    if (!ready) return;
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
      props.onDone?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  // Enter confirma quando não se está a escrever ou a escolher num campo.
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditing(event.target)) return;
      event.preventDefault();
      void confirmRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A cadeira, o tipo e as escolhas em botões ocupam a largura toda; o resto vai dois a dois.
  const wide = (name: ClassificationField) =>
    name === "unit" ||
    name === "document_type" ||
    (options(name).length > 0 && options(name).length <= 3);
  const field = (name: ClassificationField) => (
    <Field
      key={name}
      field={name}
      doc={doc}
      labels={labels}
      value={draft[name] ?? ""}
      choices={options(name)}
      onChange={(value) => set(name, value)}
      color={
        name === "document_type"
          ? typeColor(labels.vocab.document_types, draft.document_type)
          : undefined
      }
    />
  );
  const explained = visible.filter((f) => doc.classification[f]?.reasons?.length);
  return (
    <div className="flex flex-col xl:h-full xl:min-h-0">
      <div className="space-y-4 p-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {doc.review_reasons.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("review.reasons")}>
            {doc.review_reasons.map((reason, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: razões não têm id próprio
                key={index}
                className="rounded-full bg-clay-soft px-2.5 py-0.5 text-xs font-medium text-clay"
              >
                <ReasonText reason={reason} />
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-3">
          {visible.map((name) => (
            <div key={name} className={wide(name) ? "col-span-2" : ""}>
              {field(name)}
            </div>
          ))}
        </div>
        {explained.length > 0 && (
          <details className="rounded-xl border border-dashed border-line-strong px-3 py-2 text-xs text-ink-soft">
            <summary className="cursor-pointer font-semibold">{t("review.why")}</summary>
            {explained.map((name) => (
              <div key={name} className="mt-2">
                <p className="font-semibold">{t(`fields.${name}`)}</p>
                <ReasonList reasons={doc.classification[name]?.reasons} />
              </div>
            ))}
          </details>
        )}
      </div>
      <div className="space-y-2 border-t border-line p-4">
        {error ? <ErrorBox error={error} /> : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={!ready}
            className={`${buttonClass("primary")} flex-1 justify-center`}
          >
            {busy ? t("common.saving") : t("review.confirm")}
          </button>
          {props.onSkip && (
            <Button variant="secondary" onClick={props.onSkip}>
              {t("review.skip")}
            </Button>
          )}
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted">
          <span>
            <Kbd>Enter</Kbd> {t("review.key_confirm")}
          </span>
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {t("review.key_move")}
          </span>
          <span>
            <Kbd>Del</Kbd> {t("review.key_remove")}
          </span>
        </p>
      </div>
    </div>
  );
}

function Kbd(props: { children: string }) {
  return (
    <kbd className="rounded border border-b-2 border-line-strong bg-white px-1 font-sans text-[0.65rem] text-ink-soft">
      {props.children}
    </kbd>
  );
}

/** O utilizador está a escrever ou a escolher (os atalhos não se aplicam). */
export function isEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // Os ficheiros da lista são botões, mas lá os atalhos continuam a valer.
  if (target.dataset.shortcuts) return false;
  return (
    target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)
  );
}
