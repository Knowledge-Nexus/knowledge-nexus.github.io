// Descarregar vários documentos num .zip, criado no browser (fflate).

import { zipSync } from "fflate";
import type { DataSource } from "../data/source";
import type { DocumentRow } from "../data/types";
import type { Labels } from "./labels";
import { originalName } from "./titles";

function safe(part: string): string {
  return part.replace(/[\\/:*?"<>|]+/g, "-").trim() || "sem-nome";
}

export async function downloadZip(
  source: DataSource,
  docs: DocumentRow[],
  labels: Labels,
  zipName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  const used = new Set<string>();
  let done = 0;
  for (const doc of docs) {
    const type = doc.document_type ? safe(labels.term("document_types", doc.document_type)) : "";
    // Um conjunto fica numa pasta própria, com os nomes originais dos ficheiros.
    const folder = doc.bundle_name ? [type, safe(doc.bundle_name)].filter(Boolean).join("/") : type;
    const base = safe(doc.bundle_name ? originalName(doc) : doc.display_name || originalName(doc));
    const first = folder ? `${folder}/${base}` : base;
    let path = first;
    for (let n = 2; used.has(path); n++) path = first.replace(/(\.[^./]+)?$/, `-${n}$1`);
    used.add(path);
    // Os PDF e os Office já vêm comprimidos: guardar sem voltar a comprimir é mais rápido.
    files[path] = [await source.binary(doc.original_path), { level: 0 }];
    onProgress?.(++done, docs.length);
  }
  const blob = new Blob([zipSync(files).slice()], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Sem acentos no nome do zip: alguns browsers ignoram-no e dão "download" sem extensão.
  a.download = `${safe(zipName.normalize("NFD").replace(/\p{M}/gu, ""))}.zip`;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
