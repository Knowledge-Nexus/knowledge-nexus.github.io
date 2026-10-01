// Ficheiros de um conjunto: mostra quais são, e permite acrescentar ou retirar ficheiros
// e mudar o nome. As alterações ficam num rascunho até "Guardar" (um só commit).

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useApp } from "../data/context";
import type { DocumentRow } from "../data/types";
import { saveBundle } from "../lib/bundles";
import { normalize } from "../lib/normalize";
import { originalName } from "../lib/titles";
import { FileBadge } from "./FileBadge";
import { IconStack } from "./icons";
import { Badge, Button, ErrorBox, Notice } from "./ui";

const MAX_RESULTS = 8;

function shortPath(doc: DocumentRow): string {
  return (doc.source_path ?? doc.display_name).replace(/!\//g, "/");
}

export function BundleEditor(props: { doc: DocumentRow }) {
  const { t } = useTranslation();
  const { meta, login, source, notifyCommit, readOnly, to } = useApp();
  const { doc } = props;
  const current = useMemo(
    () => (doc.bundle_id && meta ? meta.bundleMembers(doc.bundle_id) : []),
    [doc.bundle_id, meta],
  );
  const [added, setAdded] = useState<DocumentRow[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [name, setName] = useState(doc.bundle_name ?? "");
  const [lead, setLead] = useState<string | null>(doc.bundle_lead);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!doc.bundle_id || !meta) return null;

  const members = [...current, ...added];
  const kept = members.filter((m) => !removed.has(m.id));
  const changed =
    added.length > 0 ||
    removed.size > 0 ||
    name.trim() !== doc.bundle_name ||
    lead !== doc.bundle_lead;
  const inBundle = new Set(members.map((m) => m.id));
  const q = normalize(query);
  const candidates = q
    ? meta
        .documents({ owner: login })
        .filter((d) => !inBundle.has(d.id) && d.kind !== "archive")
        .filter((d) => normalize(`${shortPath(d)} ${d.display_name}`).includes(q))
        .sort((a, b) => Number(b.unit === doc.unit) - Number(a.unit === doc.unit))
        .slice(0, MAX_RESULTS)
    : [];

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveBundle(
        source,
        { id: doc.bundle_id!, name: name.trim() || (doc.bundle_name ?? ""), leadChoice: lead },
        kept,
        members.filter((m) => removed.has(m.id)),
      );
      notifyCommit();
      setSaved(true);
      setDirty(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const edit = () => {
    setDirty(true);
    setSaved(false);
  };
  const toggle = (id: string) =>
    setRemoved((all) => {
      edit();
      const next = new Set(all);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3 rounded-xl border border-gold/50 bg-marker-soft/40 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium text-ink">
        <IconStack size={16} />
        {t("bundle.members_title", { count: kept.length })}
      </p>
      <p className="text-xs text-muted">
        {t(doc.bundle_method === "user" ? "bundle.by_user" : "bundle.by_folder")}{" "}
        {t("bundle.explain")}
      </p>
      <ul className="space-y-1">
        {members.map((m) => {
          const out = removed.has(m.id);
          return (
            <li
              key={m.id}
              className={`flex items-center gap-2 rounded-lg bg-sheet px-2 py-1 ${out ? "opacity-50" : ""}`}
            >
              <span className="scale-75">
                <FileBadge ext={m.ext} kind={m.kind} />
              </span>
              <span className="min-w-0 flex-1">
                {m.id === doc.id ? (
                  <span className={`block truncate font-medium ${out ? "line-through" : ""}`}>
                    {originalName(m)}
                  </span>
                ) : (
                  <Link
                    to={to(`/documento/${m.id}`)}
                    className={`block truncate underline-offset-2 hover:underline ${out ? "line-through" : ""}`}
                  >
                    {originalName(m)}
                  </Link>
                )}
                <span className="block truncate text-xs text-muted" title={shortPath(m)}>
                  {shortPath(m)}
                </span>
              </span>
              {m.id === lead && !out ? (
                <Badge tone="info">{t("bundle.lead")}</Badge>
              ) : (
                !readOnly &&
                !out && (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-pen underline-offset-2 hover:underline"
                    onClick={() => {
                      edit();
                      setLead(m.id);
                    }}
                  >
                    {t("bundle.make_lead")}
                  </button>
                )
              )}
              {added.some((a) => a.id === m.id) && <Badge tone="warn">{t("bundle.new")}</Badge>}
              {!readOnly && (
                <button
                  type="button"
                  className="shrink-0 text-xs text-clay underline-offset-2 hover:underline"
                  onClick={() => {
                    if (added.some((a) => a.id === m.id)) {
                      edit();
                      setAdded((all) => all.filter((a) => a.id !== m.id));
                    } else toggle(m.id);
                  }}
                >
                  {out ? t("bundle.undo") : t("bundle.remove")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {!readOnly && (
        <>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("bundle.add_label")}</span>
            <input
              className="mt-1 w-full rounded-lg border border-line-strong bg-sheet px-2 py-1.5"
              placeholder={t("bundle.add_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {q && candidates.length === 0 && (
            <p className="text-xs text-muted">{t("bundle.add_none")}</p>
          )}
          {candidates.length > 0 && (
            <ul className="space-y-0.5">
              {candidates.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="scale-75">
                    <FileBadge ext={c.ext} kind={c.kind} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs" title={shortPath(c)}>
                    {shortPath(c)}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-pen underline-offset-2 hover:underline"
                    onClick={() => {
                      edit();
                      setAdded((all) => [...all, c]);
                      setQuery("");
                    }}
                  >
                    {t("bundle.add")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("bundle.name_label")}</span>
            <input
              className="mt-1 w-full rounded-lg border border-line-strong bg-sheet px-2 py-1.5"
              value={name}
              onChange={(e) => {
                edit();
                setName(e.target.value);
              }}
            />
          </label>
          {kept.length < 2 && dirty && changed && (
            <p className="text-xs text-clay">{t("bundle.will_dissolve")}</p>
          )}
          {dirty && changed && (
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? t("common.saving") : t("bundle.save")}
            </Button>
          )}
        </>
      )}
      {saved && <Notice>{t("common.pending_sync")}</Notice>}
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}
