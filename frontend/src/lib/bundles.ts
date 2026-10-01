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
