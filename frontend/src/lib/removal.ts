// Remover documentos (caixote do lixo em «A rever»). O registo ganha `removed` e o motor
// deixa-o fora da biblioteca, de «A rever» e da pesquisa; o original fica sempre guardado.
// Repor é tirar o campo (ou depositar o mesmo ficheiro outra vez).

import { useSyncExternalStore } from "react";
import { type DataSource, nowIso } from "../data/source";
import type { MetaIndex } from "../data/sqlite/queries";
import type { DocumentRow } from "../data/types";

export function markRemoved(record: Record<string, unknown>, login: string): void {
  record.removed = { at: nowIso(), by: login };
}

export function unmarkRemoved(record: Record<string, unknown>): void {
  delete record.removed;
}

/**
 * Os registos que saem (ou voltam) juntos: os documentos escolhidos e as cópias exactas de
 * cada um, que sem o original passavam a aparecer sozinhas.
 */
export function withCopies(meta: MetaIndex, docs: DocumentRow[], includeRemoved = false): string[] {
  const ids = new Set<string>();
  for (const doc of docs) {
    ids.add(doc.id);
    for (const copy of meta.copiesOf(doc.id, includeRemoved)) ids.add(copy.id);
  }
  return [...ids].sort();
}

export function removeDocuments(
  source: DataSource,
  ids: string[],
  login: string,
  label: string,
): Promise<string> {
  return source.patchDocuments(
    ids.map((id) => ({ id, patch: (record) => markRemoved(record, login) })),
    `remover: ${label}`,
  );
}

export function restoreDocuments(
  source: DataSource,
  ids: string[],
  label: string,
): Promise<string> {
  return source.patchDocuments(
    ids.map((id) => ({ id, patch: unmarkRemoved })),
    `repor: ${label}`,
  );
}

// Até o índice ser reconstruído, o que acabaste de remover (ou repor) já não se mostra onde
// estava. Vale só nesta sessão.

const hidden = new Set<string>();
const restored = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: Removals = { hidden: new Set<string>(), restored: new Set<string>() };

function changed() {
  snapshot = { hidden: new Set(hidden), restored: new Set(restored) };
  for (const listener of listeners) listener();
}

export function hideRemoved(ids: string[]): void {
  for (const id of ids) {
    hidden.add(id);
    restored.delete(id);
  }
  changed();
}

export function showRestored(ids: string[]): void {
  for (const id of ids) {
    hidden.delete(id);
    restored.add(id);
  }
  changed();
}

/** O índice novo já diz o que foi feito: deixa de ser preciso escondê-los aqui. */
export function settleRemovals(meta: MetaIndex): void {
  let dirty = false;
  for (const id of hidden) {
    if (meta.document(id)?.status === "removed") {
      hidden.delete(id);
      dirty = true;
    }
  }
  for (const id of restored) {
    const status = meta.document(id)?.status;
    if (status && status !== "removed") {
      restored.delete(id);
      dirty = true;
    }
  }
  if (dirty) changed();
}

export interface Removals {
  hidden: Set<string>;
  restored: Set<string>;
}

export const removalSnapshot = (): Removals => snapshot;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRemovals(): Removals {
  return useSyncExternalStore(subscribe, removalSnapshot);
}
