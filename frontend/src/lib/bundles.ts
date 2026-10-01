// Conjuntos: ficheiros que só fazem sentido juntos (enunciado + código + imagens).
// Juntar e separar são correcções do utilizador (method: user / bundle_dismissed); o motor
// escolhe o documento principal e arruma os outros com ele.

import type { DataSource } from "../data/source";
import type { DocumentRow } from "../data/types";
import { originalName } from "./titles";

/** Nome sugerido: a pasta comum dos ficheiros, ou o nome do primeiro. */
export function suggestBundleName(docs: DocumentRow[]): string {
  const folders = docs.map((d) =>
    (d.source_path ?? "").replace(/!\//g, "/").split("/").slice(0, -1),
  );
  const common: string[] = [];
  for (let i = 0; folders.every((f) => i < f.length && f[i] === folders[0]?.[i]); i++) {
    common.push(folders[0]![i]!);
  }
  const folder = common.at(-1)?.replace(/\.(zip|rar|7z|tar|tgz)$/i, "");
  if (folder) return folder;
  const first = docs[0];
  return first ? originalName(first).replace(/\.[^.]+$/, "") : "";
}

export function newBundleId(): string {
  return `meu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function joinBundle(source: DataSource, docs: DocumentRow[], name: string) {
  const ref = { id: newBundleId(), name: name.trim(), method: "user" };
  return source.patchDocuments(
    docs.map((d) => ({
      id: d.id,
      patch: (record) => {
        record.bundle = { ...ref };
        delete record.bundle_dismissed;
      },
    })),
    `conjunto: ${ref.name} (${docs.length} ficheiros)`,
  );
}

export function separateBundle(source: DataSource, docs: DocumentRow[]) {
  return source.patchDocuments(
    docs.map((d) => ({
      id: d.id,
      patch: (record) => {
        delete record.bundle;
        record.bundle_dismissed = true;
      },
    })),
    `conjunto: separar ${docs.length} ficheiro(s)`,
  );
}

/**
 * Guarda as alterações a um conjunto (ficheiros acrescentados ou retirados). O conjunto
 * passa a ser teu (`method: user`): o motor deixa de o recalcular a partir das pastas.
 * Com menos de dois ficheiros, desfaz-se.
 */
export function saveBundle(
  source: DataSource,
  bundle: { id: string; name: string; leadChoice?: string | null },
  members: DocumentRow[],
  removed: DocumentRow[],
) {
  const dissolve = members.length < 2;
  const lead = members.some((m) => m.id === bundle.leadChoice) ? bundle.leadChoice : null;
  const ref = {
    id: bundle.id,
    name: bundle.name.trim(),
    method: "user",
    ...(lead ? { lead_choice: lead } : {}),
  };
  const leaving = dissolve ? [...removed, ...members] : removed;
  return source.patchDocuments(
    [
      ...(dissolve ? [] : members).map((d) => ({
        id: d.id,
        patch: (record: Record<string, unknown>) => {
          record.bundle = { ...ref };
          delete record.bundle_dismissed;
        },
      })),
      ...leaving.map((d) => ({
        id: d.id,
        patch: (record: Record<string, unknown>) => {
          delete record.bundle;
          record.bundle_dismissed = true;
        },
      })),
    ],
    `conjunto: ${ref.name} (${dissolve ? "desfeito" : `${members.length} ficheiros`})`,
  );
}
