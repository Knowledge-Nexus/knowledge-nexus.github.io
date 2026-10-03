// Editar ou remover uma cadeira: grava um pedido de catálogo que o motor aplica.
// Mudar o identificador é criar a cadeira nova e remover a antiga, juntando os documentos.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, UnitRow } from "../../data/types";
import { slugify } from "../../lib/normalize";

export function UnitEditor(props: { unit: UnitRow }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit, readOnly } = useApp();
  const { unit } = props;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(unit.name);
  const [acronym, setAcronym] = useState(unit.acronym ?? "");
  const [slug, setSlug] = useState(unit.slug);
  const [mergeInto, setMergeInto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  if (!meta || readOnly) return null;
  const institution = meta.institutions().find((i) => i.slug === unit.institution);
  const others = meta
    .units()
    .filter((u) => u.key !== unit.key)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  const taken = meta.units().some((u) => u.institution === unit.institution && u.slug === slug);
  const newKey = `${unit.institution}/${slug}`;

  async function send(bundle: CatalogBundle, message: string) {
    setBusy(true);
    setError(null);
    try {
      await source.catalogRequest(bundle, message);
      notifyCommit();
      setSaved(true);
      setOpen(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const renamed = slug !== unit.slug;
    void send(
      {
        format: "nexus-catalogo",
        version: 1,
        institutions: [
          {
            slug: unit.institution,
            name: institution?.name ?? unit.institution,
            units: [
              {
                slug,
                name: name.trim() || unit.name,
                ...(acronym.trim() ? { acronym: acronym.trim() } : {}),
              },
            ],
          },
        ],
        ...(renamed ? { units_remove: [{ unit: unit.key, merge_into: newKey }] } : {}),
      },
      `catálogo: editar cadeira ${unit.key}`,
    );
  }

  function remove() {
    const target = others.find((u) => u.key === mergeInto);
    const text = target
      ? t("unit_edit.remove_merge_confirm", { name: unit.name, target: target.name })
      : t("unit_edit.remove_confirm", { name: unit.name });
    if (!window.confirm(text)) return;
    void send(
      {
        format: "nexus-catalogo",
        version: 1,
        units_remove: [{ unit: unit.key, ...(target ? { merge_into: target.key } : {}) }],
      },
      `catálogo: remover cadeira ${unit.key}`,
    );
  }

  const input = "rounded-lg border border-line-strong bg-sheet px-2 py-1 text-sm";
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="text-sm text-pen hover:underline"
          onClick={() => {
            setOpen(true);
            setSaved(false);
          }}
        >
          {t("unit_edit.open")}
        </button>
        {saved && <span className="text-sm text-sage">✓ {t("common.pending_sync")}</span>}
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-xl border border-line bg-paper p-4 text-sm">
      <div className="flex flex-wrap gap-3">
        <label>
          {t("unit_edit.name")}{" "}
          <input
            className={`${input} w-80 max-w-full`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          {t("unit_edit.acronym")}{" "}
          <input
            className={`${input} w-24`}
            value={acronym}
            onChange={(e) => setAcronym(e.target.value)}
          />
        </label>
        <label>
          {t("unit_edit.slug")}{" "}
          <input
            className={input}
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value, 30))}
          />
        </label>
      </div>
      {slug !== unit.slug && taken && <p className="text-clay">{t("unit_edit.slug_taken")}</p>}
      {slug !== unit.slug && !taken && slug && (
        <p className="text-muted">{t("unit_edit.slug_hint")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !slug || (slug !== unit.slug && taken)} onClick={save}>
          {t("unit_edit.save")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>
          {t("unit_edit.cancel")}
        </Button>
      </div>
      <div className="space-y-2 border-t border-line pt-3">
        <p className="font-semibold text-ink">{t("unit_edit.remove_title")}</p>
        <label className="block">
          {t("unit_edit.merge_into")}{" "}
          <select
            className={input}
            value={mergeInto}
            onChange={(e) => setMergeInto(e.target.value)}
          >
            <option value="">{t("unit_edit.merge_none")}</option>
            {others.map((u) => (
              <option key={u.key} value={u.key}>
                {u.acronym ? `${u.name} (${u.acronym})` : u.name}
              </option>
            ))}
          </select>
        </label>
        <Button variant="danger" disabled={busy} onClick={remove}>
          {t("unit_edit.remove")}
        </Button>
      </div>
      {error ? <ErrorBox error={error} /> : null}
      {busy && <Notice>{t("common.saving")}</Notice>}
    </div>
  );
}
