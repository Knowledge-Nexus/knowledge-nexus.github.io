// Editar ou remover uma cadeira: grava um pedido de catálogo que o motor aplica.
// Mudar o identificador é criar a cadeira nova e remover a antiga, juntando os documentos.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, UnitRow } from "../../data/types";
import { slugify } from "../../lib/normalize";

/** Formulário para editar ou remover a cadeira; o botão que o abre está no cabeçalho. */
export function UnitEditor(props: { unit: UnitRow; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit, readOnly } = useApp();
  const { unit } = props;
  const [name, setName] = useState(unit.name);
  const [acronym, setAcronym] = useState(unit.acronym ?? "");
  const [slug, setSlug] = useState(unit.slug);
  const [aliases, setAliases] = useState("");
  const [mergeInto, setMergeInto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
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
      props.onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  // Acrescentados aos que já existem (o motor junta as listas, não as substitui).
  const aliasList = aliases
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

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
                ...(aliasList.length ? { aliases: aliasList } : {}),
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
      <label className="block">
        {t("unit_edit.aliases")}{" "}
        <input
          className={`${input} w-full max-w-xl`}
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder={t("unit_edit.aliases_placeholder")}
        />
        <span className="mt-1 block text-xs text-muted">{t("unit_edit.aliases_help")}</span>
      </label>
      {slug !== unit.slug && taken && <p className="text-clay">{t("unit_edit.slug_taken")}</p>}
      {slug !== unit.slug && !taken && slug && (
        <p className="text-muted">{t("unit_edit.slug_hint")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !slug || (slug !== unit.slug && taken)} onClick={save}>
          {t("unit_edit.save")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={props.onClose}>
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
