// Utilitários de envio: SHA-256, lotes, lixo de SO e pastas a ignorar.

export const MAX_FILE_BYTES = 95 * 1024 * 1024; // o GitHub recusa ficheiros com mais de 100 MB
const JUNK = new Set([".ds_store", "thumbs.db", "desktop.ini"]);
// Directórios gerados que não vale a pena enviar (a lista completa está no motor).
export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
  ".next",
  ".gradle",
  ".mypy_cache",
  ".pytest_cache",
]);

export interface PickedFile {
  file: File;
  relativePath: string;
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", buffer as ArrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isJunk(path: string): boolean {
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  return JUNK.has(name) || name.startsWith("._") || path.split("/").includes("__MACOSX");
}

export function inIgnoredDir(path: string): boolean {
  return path
    .split("/")
    .slice(0, -1)
    .some((part) => IGNORED_DIRS.has(part));
}

/** Nome de lote reconhecido pelo motor como "envio pela interface". */
export function newBatchId(now = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const random = Math.random().toString(36).slice(2, 6).padEnd(4, "0");
  return `${stamp}-${random}`;
}

export function safeRelativePath(path: string): string | null {
  const parts = path
    .replace(/\\/g, "/")
    .split("/")
    .filter((p) => p && p !== ".");
  if (parts.length === 0 || parts.some((p) => p === "..")) return null;
  return parts.join("/");
}

type Entry = FileSystemEntry;

function readEntries(reader: FileSystemDirectoryReader): Promise<Entry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

async function walk(entry: Entry, prefix: string, out: PickedFile[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    out.push({ file, relativePath: `${prefix}${entry.name}` });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries devolve em blocos; ler até vir vazio.
    for (;;) {
      const batch = await readEntries(reader);
      if (batch.length === 0) break;
      for (const child of batch) await walk(child, `${prefix}${entry.name}/`, out);
    }
  }
}

/** Ficheiros e pastas largados (DataTransfer), com caminhos relativos preservados. */
export async function filesFromDrop(data: DataTransfer): Promise<PickedFile[]> {
  const out: PickedFile[] = [];
  const entries = [...data.items]
    .map((item) => (item.kind === "file" ? item.webkitGetAsEntry?.() : null))
    .filter((e): e is Entry => Boolean(e));
  if (entries.length > 0) {
    for (const entry of entries) await walk(entry, "", out);
    return out;
  }
  return [...data.files].map((file) => ({ file, relativePath: file.name }));
}

export function filesFromInput(list: FileList | null): PickedFile[] {
  return [...(list ?? [])].map((file) => ({
    file,
    relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  }));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
