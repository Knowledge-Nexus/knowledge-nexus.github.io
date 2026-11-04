// Caixote do lixo em «A rever»: tirar um ficheiro (ou vários) da biblioteca, de «A rever» e
// da pesquisa, com confirmação, «Desfazer» e a lista «Removidos» para repor.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IconTrash } from "../../components/icons";
import { Button, ErrorBox } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow } from "../../data/types";
import {
  hideRemoved,
  removeDocuments,
  restoreDocuments,
  showRestored,
  withCopies,
} from "../../lib/removal";
import { originalName } from "../../lib/titles";

export interface Removal {
  ids: string[];
  label: string;
}

const labelOf = (docs: DocumentRow[]) =>
  docs.length === 1 ? originalName(docs[0]!) : `${docs.length} documento(s)`;

/**
 * O botão e a confirmação. `docs` são os que se vêem na lista; `followers` os que vão com eles
 * (os outros ficheiros do conjunto). As cópias exactas também saem.
 */
export function RemoveButton(props: {
  docs: DocumentRow[];
  followers?: DocumentRow[];
  onRemoved: (removal: Removal) => void;
}) {
  const { t } = useTranslation();
  const { meta, source, login, notifyCommit } = useApp();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { docs } = props;
  const all = [...docs, ...(props.followers ?? [])];
  const ids = meta ? withCopies(meta, all) : all.map((d) => d.id);
  const also = ids.length - docs.length;
  const label = labelOf(docs);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await removeDocuments(source, ids, login, label);
      notifyCommit();
      hideRemoved(ids);
      props.onRemoved({ ids, label });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  if (!asking)
    return (
      <Button
        variant="danger"
        onClick={() => setAsking(true)}
        aria-label={docs.length === 1 ? t("review.remove_one") : undefined}
        title={docs.length === 1 ? t("review.remove_one") : undefined}
      >
        <IconTrash size={16} />
        {docs.length === 1 ? t("review.remove") : t("review.remove_many", { count: docs.length })}
      </Button>
    );

  return (
    <div
      role="alertdialog"
      aria-label={t("review.remove_title")}
      className="basis-full space-y-3 rounded-xl border border-clay/30 bg-clay-soft/50 p-3 text-sm"
    >
      <p className="font-medium text-ink">
        {docs.length === 1
          ? t("review.remove_confirm_one", { name: label })
          : t("review.remove_confirm_many", { count: docs.length })}
      </p>
      <p className="text-ink-soft">{t("review.remove_safe")}</p>
      {also > 0 && <p className="text-ink-soft">{t("review.remove_also", { count: also })}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" disabled={busy} onClick={() => void remove()}>
          <IconTrash size={16} />
          {busy ? t("common.saving") : t("review.remove")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => setAsking(false)}>
          {t("common.cancel")}
        </Button>
      </div>
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}

/** «Removeste … · Desfazer», logo depois de remover. */
export function RemovedNotice(props: { removal: Removal; onClose: () => void }) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { removal } = props;

  async function undo() {
    setBusy(true);
    setError(null);
    try {
      await restoreDocuments(source, removal.ids, removal.label);
      notifyCommit();
      showRestored(removal.ids);
      props.onClose();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-line-strong bg-sheet p-3 text-sm"
    >
      <IconTrash size={16} className="text-clay" />
      <p className="flex-1">{t("review.removed_notice", { name: removal.label })}</p>
      <Button variant="secondary" disabled={busy} onClick={() => void undo()}>
        {t("review.undo")}
      </Button>
      <Button variant="ghost" disabled={busy} onClick={props.onClose}>
        {t("review.dismiss")}
      </Button>
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}

/** «Repor»: volta à biblioteca (ou a «A rever») com as cópias exactas que saíram com ele. */
export function RestoreButton(props: { doc: DocumentRow }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit } = useApp();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function restore() {
    setBusy(true);
    setError(null);
    try {
      const ids = meta ? withCopies(meta, [props.doc], true) : [props.doc.id];
      await restoreDocuments(source, ids, originalName(props.doc));
      notifyCommit();
      showRestored(ids);
      setDone(true);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  if (done)
    return (
      <p className="text-sm text-sage">
        ✓ {t("review.restored")} {t("common.pending_sync")}
      </p>
    );
  return (
    <>
      <Button variant="secondary" disabled={busy} onClick={() => void restore()}>
        {t("review.restore")}
      </Button>
      {error ? <ErrorBox error={error} /> : null}
    </>
  );
}

/** Os que removeste, para repor (fechado por defeito, no fim de «A rever»). */
export function RemovedList(props: { docs: DocumentRow[] }) {
  const { t } = useTranslation();
  const { to } = useApp();
  if (props.docs.length === 0) return null;
  return (
    <details className="rounded-2xl border border-line bg-sheet/60 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
        {t("review.removed_title", { count: props.docs.length })}
      </summary>
      <p className="mt-2 text-xs text-muted">{t("review.removed_text")}</p>
      <ul className="mt-3 divide-y divide-line">
        {props.docs.map((doc) => (
          <li key={doc.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <Link
              className="min-w-0 flex-1 truncate hover:text-pen hover:underline"
              to={to(`/documento/${doc.id}`)}
              title={doc.source_path ?? doc.display_name}
            >
              {originalName(doc)}
            </Link>
            <RestoreButton doc={doc} />
          </li>
        ))}
      </ul>
    </details>
  );
}
