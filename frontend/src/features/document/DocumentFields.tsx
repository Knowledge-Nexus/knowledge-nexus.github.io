// Campos do documento que o dono (ou quem entrou com um código de acesso) muda no sítio: um
// lápis ao lado de cada valor abre o editor desse campo. Cada alteração é um commit no
// registo do documento com `method: user`; o motor nunca a sobrepõe e volta a arrumar o
// documento com o valor novo.

import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ConfidenceBadge, EditButton, ErrorBox, ReasonList } from "../../components/ui";
import { useApp } from "../../data/context";
import type { ClassificationField, DocumentRow } from "../../data/types";
import { academicYears, FIELD_VOCAB, type Labels } from "../../lib/labels";

const input =
  "w-full rounded-lg border border-line-strong bg-sheet px-2 py-1.5 text-sm focus:border-pen focus:outline-none";

/** Campos que se podem deixar sem valor (os obrigatórios para arrumar não). */
const OPTIONAL: ReadonlySet<ClassificationField> = new Set([
  "academic_year",
  "exam_season",
  "assessment_number",
  "date",
  "variant",
  "solution_origin",
]);

/**
 * Grava um campo escolhido pela pessoa. `null` grava "sem valor" como escolha dela (o motor
 * não volta a preencher o campo); para o nome, `null` volta ao nome automático.
 */
export function setUserField(
  record: Record<string, unknown>,
  field: ClassificationField,
  raw: string | null,
  login: string,
): void {
  const classification = (record.classification as Record<string, unknown> | undefined) ?? {};
  const value =
    raw === null || raw.trim() === ""
      ? null
      : field === "assessment_number"
        ? Number(raw)
        : raw.trim();
  if (value === null && field === "title") delete classification[field];
  else
    classification[field] = {
      value,
      confidence: 1,
      method: "user",
      reasons: [{ code: "user.set", params: { login } }],
    };
  record.classification = classification;
}

function useFieldSaver(doc: DocumentRow) {
  const { source, login, notifyCommit } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function save(field: ClassificationField, raw: string | null): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await source.patchDocument(
        doc.id,
        (record) => setUserField(record, field, raw, login),
        `documento: ${field} de ${doc.display_name}`,
      );
      notifyCommit();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { save, busy, error };
}

/** O nome do documento, com lápis para lhe dar outro (ou voltar ao automático). */
export function TitleEditor(props: {
  doc: DocumentRow;
  title: string;
  canEdit: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { doc } = props;
  const userTitle = doc.classification.title?.value as string | undefined;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(userTitle ?? props.title);
  const [shown, setShown] = useState<string | null>(null);
  const { save, busy, error } = useFieldSaver(doc);

  if (!editing)
    return (
      <div className="flex items-start gap-1">
        <h1 className="min-w-0 font-serif text-2xl font-semibold break-words text-ink sm:text-3xl">
          {shown ?? props.title}
        </h1>
        {props.canEdit && (
          <EditButton
            className="mt-1"
            label={t("edit.title")}
            onClick={() => {
              setValue(shown ?? userTitle ?? props.title);
              setEditing(true);
            }}
          />
        )}
        {props.children}
      </div>
    );

  return (
    <form
      className="space-y-2"
      aria-label={t("edit.title")}
      onSubmit={(e) => {
        e.preventDefault();
        void save("title", value).then((ok) => {
          if (!ok) return;
          setShown(value.trim() || null);
          setEditing(false);
        });
      }}
    >
      <label className="block text-xs text-muted" htmlFor="document-title">
        {t("fields.title")}
      </label>
      <input
        id="document-title"
        className={`${input} max-w-2xl font-serif text-xl`}
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !value.trim()}>
          {busy ? t("common.saving") : t("common.save")}
        </Button>
        {userTitle && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void save("title", null).then((ok) => {
                if (!ok) return;
                setShown(null);
                setEditing(false);
              })
            }
          >
            {t("edit.title_reset")}
          </Button>
        )}
        <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
          {t("common.cancel")}
        </Button>
      </div>
      {error ? <ErrorBox error={error} /> : null}
    </form>
  );
}

type RowField = ClassificationField | "institution";

/** Editor de um campo: cadeira (com a instituição), listas do vocabulário, ano, número, data. */
function FieldForm(props: {
  doc: DocumentRow;
  field: RowField;
  labels: Labels;
  onSaved: (field: ClassificationField, value: string | null) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { meta } = useApp();
  const { doc, labels } = props;
  const field: ClassificationField = props.field === "institution" ? "unit" : props.field;
  const current = doc.classification[field]?.value;
  const [value, setValue] = useState(
    current === null || current === undefined ? "" : String(current),
  );
  const institutions = meta?.institutions() ?? [];
  const unitRow = labels.units.find((u) => u.key === value);
  const [institution, setInstitution] = useState(
    unitRow?.institution ?? institutions[0]?.slug ?? "",
  );
  const { save, busy, error } = useFieldSaver(doc);

  let control: ReactNode;
  if (field === "unit") {
    const units = labels.units
      .filter((u) => u.institution === institution)
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
    control = (
      <div className="space-y-2">
        {institutions.length > 1 && (
          <label className="block space-y-1">
            <span className="block text-xs text-muted">{t("fields.institution")}</span>
            <select
              className={input}
              value={institution}
              onChange={(e) => {
                setInstitution(e.target.value);
                setValue("");
              }}
            >
              {institutions.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.acronym ? `${i.name} (${i.acronym})` : i.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block space-y-1">
          <span className="block text-xs text-muted">{t("fields.unit")}</span>
          <select className={input} value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">{t("review.choose")}</option>
            {units.map((u) => (
              <option key={u.key} value={u.key}>
                {labels.unit(u.key)}
              </option>
            ))}
          </select>
        </label>
        {props.field === "institution" && (
          <p className="text-xs text-muted">{t("edit.institution_hint")}</p>
        )}
      </div>
    );
  } else if (field === "academic_year") {
    control = (
      <select className={input} value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">{t("edit.no_value")}</option>
        {academicYears(value ? [value] : []).map((y) => (
          <option key={y} value={y}>
            {y.replace("-", "/")}
          </option>
        ))}
      </select>
    );
  } else if (field === "assessment_number") {
    control = (
      <input
        type="number"
        min={1}
        className={`${input} w-28`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  } else if (field === "date") {
    control = (
      <input
        type="date"
        className={`${input} w-48`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  } else if (field === "variant") {
    control = (
      <input
        className={`${input} w-28`}
        value={value}
        maxLength={12}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  } else {
    const kind = FIELD_VOCAB[field];
    const options = kind ? labels.vocab[kind] : [];
    control = (
      <select className={input} value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">{OPTIONAL.has(field) ? t("edit.no_value") : t("review.choose")}</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const required = !OPTIONAL.has(field);
  return (
    <form
      className="mt-1 space-y-2 rounded-xl border border-pen/30 bg-pen-soft/40 p-2"
      aria-label={t("edit.field", { field: t(`fields.${props.field}`) })}
      onSubmit={(e) => {
        e.preventDefault();
        void save(field, value || null).then((ok) => ok && props.onSaved(field, value || null));
      }}
    >
      {control}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || (required && !value)}>
          {busy ? t("common.saving") : t("common.save")}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={props.onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
      {error ? <ErrorBox error={error} /> : null}
    </form>
  );
}

/** A classificação, campo a campo, com lápis em cada um para quem pode editar. */
export function ClassificationFields(props: {
  doc: DocumentRow;
  labels: Labels;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const { meta } = useApp();
  const { doc, labels, canEdit } = props;
  const [editing, setEditing] = useState<RowField | null>(null);
  // O que se gravou agora (o índice só muda depois do próximo processamento).
  const [saved, setSaved] = useState<Partial<Record<ClassificationField, string | null>>>({});

  const currentValue = (field: ClassificationField): unknown =>
    field in saved ? saved[field] : doc.classification[field]?.value;
  const typeSlug = currentValue("document_type");
  const isAssessment = Boolean(
    labels.vocab.document_types.find((d) => d.slug === typeSlug)?.is_assessment,
  );
  const unitKey = currentValue("unit") as string | null | undefined;
  const unit = labels.units.find((u) => u.key === unitKey);
  const institution = meta?.institutions().find((i) => i.slug === unit?.institution);

  const rows: RowField[] = ["unit", "institution", "document_type", "academic_year"];
  if (isAssessment || currentValue("assessment_type"))
    rows.push("assessment_type", "assessment_number", "exam_season", "date", "variant");
  rows.push("role");
  if (currentValue("role") === "solution" || currentValue("solution_origin"))
    rows.push("solution_origin");

  return (
    <dl className="space-y-3 text-sm">
      {rows.map((row) => {
        const field: ClassificationField = row === "institution" ? "unit" : row;
        const value = currentValue(field);
        const empty = value === null || value === undefined || value === "";
        // Sem lápis, só se mostram os campos com valor.
        if (!canEdit && empty) return null;
        if (row === "institution" && !institution && !canEdit) return null;
        const pending = field in saved && saved[field] !== doc.classification[field]?.value;
        const display =
          row === "institution"
            ? institution
              ? institution.acronym
                ? `${institution.name} (${institution.acronym})`
                : institution.name
              : t("common.none")
            : labels.value(field, value);
        const fieldValue = doc.classification[field];
        return (
          <div key={row} className="group">
            <dt className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>{t(`fields.${row}`)}</span>
              {row !== "institution" && !pending && <ConfidenceBadge field={fieldValue} />}
              {pending && <span className="text-pen">{t("edit.pending")}</span>}
            </dt>
            <dd className="flex items-center justify-between gap-2">
              <span className={empty ? "text-muted" : "font-medium"}>{display}</span>
              {canEdit && editing !== row && (
                <EditButton
                  label={t("edit.field", { field: t(`fields.${row}`) })}
                  onClick={() => setEditing(row)}
                  className="opacity-70 group-hover:opacity-100"
                />
              )}
            </dd>
            {editing === row && (
              <FieldForm
                doc={doc}
                field={row}
                labels={labels}
                onCancel={() => setEditing(null)}
                onSaved={(f, v) => {
                  setSaved((current) => ({ ...current, [f]: v }));
                  setEditing(null);
                }}
              />
            )}
            {row !== "institution" && !pending && fieldValue?.reasons?.length ? (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted">{t("document.why")}</summary>
                <ReasonList reasons={fieldValue.reasons} />
              </details>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}
