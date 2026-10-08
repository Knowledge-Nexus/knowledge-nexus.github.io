// Instituições: criar e editar (nome e sigla). Grava um pedido de catálogo que o motor funde;
// o identificador (slug) não muda, porque as cadeiras e os documentos referem-no.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SuggestInput } from "../../components/SuggestInput";
import { Button, Card, ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import { slugify } from "../../lib/normalize";
import { findSuggestion, institutionSuggestions } from "../../lib/reference";

const input = "rounded-lg border border-line-strong bg-sheet px-2 py-1 text-sm";

export function InstitutionManager(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  if (!meta) return null;

  const institutions = meta.institutions();
  const suggestions = institutionSuggestions(meta);
  const slug = editing ?? slugify(acronym || name, 30);
  const taken = editing === null && institutions.some((i) => i.slug === slug);
  const valid = Boolean(name.trim() && slug && !taken);

  function start(slugValue: string | null) {
    const current = institutions.find((i) => i.slug === slugValue);
    setEditing(slugValue);
    setName(current?.name ?? "");
    setAcronym(current?.acronym ?? "");
    setSaved(false);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await source.catalogRequest(
        {
          format: "nexus-catalogo",
          version: 1,
          institutions: [
            {
              slug,
              name: name.trim(),
              ...(acronym.trim() ? { acronym: acronym.trim() } : {}),
            },
          ],
        },
        `catálogo: instituição ${slug}`,
      );
      notifyCommit();
      setSaved(true);
      setName("");
      setAcronym("");
      setEditing(null);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t("institution_edit.title")}>
      <div className="space-y-4 text-sm">
        <p className="text-ink-soft">{t("institution_edit.help")}</p>
        {institutions.length > 0 && (
          <ul className="divide-y divide-line">
            {institutions.map((i) => (
              <li key={i.slug} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-serif font-semibold text-ink">
                  {i.acronym ? `${i.acronym} · ` : ""}
                  {i.name}
                </span>
                <button
                  type="button"
                  className="text-pen hover:underline"
                  onClick={() => start(i.slug)}
                >
                  {t("institution_edit.edit")}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-3 rounded-xl border border-line bg-paper p-4">
          <p className="font-semibold text-ink">
            {editing ? t("institution_edit.editing") : t("institution_edit.new")}
          </p>
          <div className="flex flex-wrap gap-3">
            <label>
              {t("unit_edit.name")}{" "}
              <SuggestInput
                className={`${input} w-80 max-w-full`}
                value={name}
                suggestions={suggestions}
                onChange={(e) => {
                  setName(e.target.value);
                  if (editing === null) {
                    const match = findSuggestion(suggestions, e.target.value);
                    if (match?.acronym && !acronym) setAcronym(match.acronym);
                  }
                }}
              />
            </label>
            <label>
              {t("unit_edit.acronym")}{" "}
              <input
                className={`${input} w-28`}
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
              />
            </label>
          </div>
          {taken && <p className="text-clay">{t("institution_edit.taken")}</p>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !valid} onClick={() => void save()}>
              {editing ? t("unit_edit.save") : t("institution_edit.create")}
            </Button>
            {editing && (
              <Button variant="secondary" disabled={busy} onClick={() => start(null)}>
                {t("unit_edit.cancel")}
              </Button>
            )}
            <Button variant="secondary" disabled={busy} onClick={props.onDone}>
              {t("institution_edit.close")}
            </Button>
          </div>
          {saved && <p className="text-sage">✓ {t("common.pending_sync")}</p>}
          {error ? <ErrorBox error={error} /> : null}
          {busy && <Notice>{t("common.saving")}</Notice>}
        </div>
      </div>
    </Card>
  );
}
