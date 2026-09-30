// Escolha de visibilidade: por cadeira (predefinição) e por documento (excepção).
// "Público" = qualquer pessoa com a ligação do site pode ver e descarregar; não aparece nos
// motores de pesquisa. "Pessoas específicas" e "Qualquer pessoa com a ligação" ficam
// visíveis mas desactivadas até haver contas (fase 5).

import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../data/context";
import type { DocumentRow } from "../data/types";
import { IconGlobe, IconLock } from "./icons";
import { Badge, Button, ErrorBox, Notice } from "./ui";

export type Choice = "private" | "public";

export function isPublic(value: string | null | undefined): boolean {
  return value === "public";
}

export function PublicBadge(props: { value: string | null | undefined }) {
  const { t } = useTranslation();
  if (!isPublic(props.value)) return null;
  return (
    <Badge tone="info">
      <IconGlobe size={12} /> {t("visibility.badge")}
    </Badge>
  );
}

function Segmented(props: {
  value: Choice;
  onChange: (value: Choice) => void;
  disabled?: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  const option = (value: Choice, icon: ReactNode) => (
    <button
      type="button"
      aria-pressed={props.value === value}
      disabled={props.disabled}
      onClick={() => props.onChange(value)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
        props.value === value ? "bg-sheet text-ink shadow-sm ring-1 ring-line" : "text-ink-soft"
      }`}
    >
      {icon} {t(`visibility.${value}`)}
    </button>
  );
  return (
    <fieldset
      aria-label={props.label}
      className="inline-flex rounded-full border border-line bg-paper p-0.5"
    >
      {option("private", <IconLock size={14} />)}
      {option("public", <IconGlobe size={14} />)}
    </fieldset>
  );
}

/** Confirmação antes de tornar algo público. */
function ConfirmPublic(props: { onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-marker/60 bg-marker-soft p-3 text-sm">
      <p>{t("visibility.confirm_text")}</p>
      <div className="flex gap-2">
        <Button onClick={props.onConfirm} disabled={props.busy}>
          {t("visibility.confirm")}
        </Button>
        <Button variant="secondary" onClick={props.onCancel} disabled={props.busy}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}

/** Visibilidade de todo o material de uma cadeira (só para o dono). */
export function UnitVisibility(props: { unitKey: string }) {
  const { t } = useTranslation();
  const { meta, login, source, notifyCommit, readOnly } = useApp();
  const current: Choice = isPublic(meta?.unitVisibility(login)[props.unitKey])
    ? "public"
    : "private";
  const [value, setValue] = useState<Choice>(current);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (readOnly) return null;

  async function save(next: Choice) {
    setBusy(true);
    setError(null);
    try {
      await source.patchUser((user) => {
        const sharing = (user.sharing as Record<string, unknown> | undefined) ?? {};
        const units = { ...((sharing.units as Record<string, string> | undefined) ?? {}) };
        if (next === "private") delete units[props.unitKey];
        else units[props.unitKey] = next;
        user.sharing = { ...sharing, units };
      });
      setValue(next);
      setSaved(true);
      setAsking(false);
      notifyCommit();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted">{t("visibility.unit_label")}</span>
        <Segmented
          label={t("visibility.unit_label")}
          value={asking ? "public" : value}
          disabled={busy}
          onChange={(next) => {
            if (next === value) return setAsking(false);
            if (next === "public") setAsking(true);
            else void save(next);
          }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {t(value === "public" ? "visibility.unit_public_hint" : "visibility.unit_private_hint")}
      </p>
      {asking && (
        <ConfirmPublic
          busy={busy}
          onConfirm={() => void save("public")}
          onCancel={() => setAsking(false)}
        />
      )}
      {saved && !asking && (
        <div className="mt-2">
          <Notice>{t("visibility.saved")}</Notice>
        </div>
      )}
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}

type DocChoice = "inherit" | Choice;

/** Visibilidade de um documento: segue a cadeira ou é uma excepção. */
export function DocumentVisibility(props: { doc: DocumentRow }) {
  const { t } = useTranslation();
  const { meta, login, source, notifyCommit, readOnly } = useApp();
  const { doc } = props;
  const unitValue: Choice = isPublic(doc.unit ? meta?.unitVisibility(login)[doc.unit] : null)
    ? "public"
    : "private";
  const initial: DocChoice = doc.visibility_inherited
    ? "inherit"
    : isPublic(doc.visibility)
      ? "public"
      : "private";
  const [value, setValue] = useState<DocChoice>(initial);
  const [asking, setAsking] = useState<DocChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (readOnly) return null;

  const effective = value === "inherit" ? unitValue : value;

  async function save(next: DocChoice) {
    setBusy(true);
    setError(null);
    try {
      await source.patchDocument(
        doc.id,
        (record) => {
          if (next === "inherit") delete record.visibility;
          else record.visibility = next;
        },
        `visibilidade: ${doc.display_name} → ${next === "inherit" ? "segue a cadeira" : next}`,
      );
      setValue(next);
      setSaved(true);
      setAsking(null);
      notifyCommit();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function choose(next: DocChoice) {
    if (next === value) return;
    const becomesPublic = (next === "inherit" ? unitValue : next) === "public";
    if (becomesPublic && effective !== "public") setAsking(next);
    else void save(next);
  }

  return (
    <div className="space-y-2 text-sm">
      <label className="block">
        <span className="sr-only">{t("visibility.document_label")}</span>
        <select
          className="w-full rounded-xl border border-line-strong bg-sheet px-3 py-2"
          value={asking ?? value}
          disabled={busy}
          onChange={(e) => choose(e.target.value as DocChoice)}
        >
          <option value="inherit">
            {t("visibility.inherit", { value: t(`visibility.${unitValue}`).toLowerCase() })}
          </option>
          <option value="private">{t("visibility.private_only")}</option>
          <option value="public">{t("visibility.public_everyone")}</option>
          <option value="users" disabled>
            {t("visibility.users_soon")}
          </option>
          <option value="link" disabled>
            {t("visibility.link_soon")}
          </option>
        </select>
      </label>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {effective === "public" ? <IconGlobe size={13} /> : <IconLock size={13} />}
        {t(effective === "public" ? "visibility.doc_public_hint" : "visibility.doc_private_hint")}
      </p>
      {asking && (
        <ConfirmPublic
          busy={busy}
          onConfirm={() => void save(asking)}
          onCancel={() => setAsking(null)}
        />
      )}
      {saved && !asking && <Notice>{t("visibility.saved")}</Notice>}
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}
