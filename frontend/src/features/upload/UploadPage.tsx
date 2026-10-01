import { type DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  ErrorBox,
  Notice,
  PageHeader,
  Spinner,
} from "../../components/ui";
import { useApp } from "../../data/context";
import type { UploadEntry } from "../../data/source";
import {
  filesFromDrop,
  filesFromInput,
  formatBytes,
  inIgnoredDir,
  isJunk,
  MAX_FILE_BYTES,
  newBatchId,
  type PickedFile,
  safeRelativePath,
  sha256Hex,
} from "../../lib/files";

type State =
  | "new"
  | "known"
  | "too_big"
  | "junk"
  | "ignored_dir"
  | "invalid"
  | "copy_batch"
  | "copy_library";

interface Row {
  path: string;
  size: number;
  state: State;
  entry?: UploadEntry;
  /** Cópia de quê: o outro ficheiro da selecção ou o documento que já tens. */
  copyOf?: string;
  /** Para "Enviar também as cópias" (só referência, sem voltar a enviar os bytes). */
  copyEntry?: UploadEntry;
}

export type Known = (sha: string) => { mine?: string; elsewhere: boolean };

/**
 * Prepara os ficheiros escolhidos: calcula o SHA-256 de cada um e separa logo as cópias
 * (o mesmo conteúdo, com qualquer nome), que não são enviadas:
 * - iguais a outro ficheiro desta selecção (ou de uma escolha anterior ainda na lista);
 * - iguais a um documento que já tens na biblioteca.
 */
export async function prepareUpload(
  files: PickedFile[],
  known: Known,
  earlier: Map<string, string> = new Map(),
): Promise<Row[]> {
  const rows: Row[] = [];
  const seen = new Map(earlier);
  for (const picked of files) {
    const path = safeRelativePath(picked.relativePath);
    const size = picked.file.size;
    if (!path) {
      rows.push({ path: picked.relativePath, size, state: "invalid" });
      continue;
    }
    if (isJunk(path)) {
      rows.push({ path, size, state: "junk" });
      continue;
    }
    if (inIgnoredDir(path)) {
      rows.push({ path, size, state: "ignored_dir" });
      continue;
    }
    if (size > MAX_FILE_BYTES) {
      rows.push({ path, size, state: "too_big" });
      continue;
    }
    const bytes = new Uint8Array(await picked.file.arrayBuffer());
    const sha256 = await sha256Hex(bytes);
    const reference: UploadEntry = { relativePath: path, sha256 };
    const twin = seen.get(sha256);
    if (twin !== undefined) {
      rows.push({ path, size, state: "copy_batch", copyOf: twin, copyEntry: reference });
      continue;
    }
    seen.set(sha256, path);
    const found = known(sha256);
    if (found.mine) {
      rows.push({ path, size, state: "copy_library", copyOf: found.mine, copyEntry: reference });
      continue;
    }
    rows.push({
      path,
      size,
      state: found.elsewhere ? "known" : "new",
      entry: found.elsewhere ? reference : { ...reference, bytes },
    });
  }
  return rows;
}

export function UploadPage() {
  const { t } = useTranslation();
  const { source, meta, login, notifyCommit } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [hashing, setHashing] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [over, setOver] = useState(false);
  const [includeCopies, setIncludeCopies] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);

  async function add(files: PickedFile[]) {
    setSent(false);
    setError(null);
    setHashing(true);
    try {
      const earlier = new Map(
        rows.flatMap((r) => (r.entry ? [[r.entry.sha256, r.path] as [string, string]] : [])),
      );
      const prepared = await prepareUpload(
        files,
        (sha) => {
          const mine = meta?.ownedSha(login, sha);
          return {
            ...(mine ? { mine: mine.source_path ?? mine.display_name } : {}),
            elsewhere: meta?.knownSha(sha) ?? false,
          };
        },
        earlier,
      );
      setRows((current) => [...current, ...prepared]);
    } catch (err) {
      setError(err);
    } finally {
      setHashing(false);
    }
  }

  async function onDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    await add(await filesFromDrop(event.dataTransfer));
  }

  const copies = rows.filter((r) => r.state === "copy_batch" || r.state === "copy_library");
  const copiesInBatch = copies.filter((r) => r.state === "copy_batch").length;
  const entries = rows.flatMap((r) =>
    r.entry ? [r.entry] : includeCopies && r.copyEntry ? [r.copyEntry] : [],
  );

  async function send() {
    setSending(true);
    setError(null);
    try {
      await source.upload(entries, newBatchId(), (done, total) => setProgress({ done, total }));
      setRows([]);
      setSent(true);
      notifyCommit();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("upload.title")} subtitle={t("upload.intro")} />
      <section
        aria-label={t("upload.drop")}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center ${over ? "border-pen bg-pen-soft" : "border-line-strong bg-sheet"}`}
      >
        <p className="text-base font-medium text-ink-soft">{t("upload.drop")}</p>
        <p className="text-xs text-muted">{t("upload.or")}</p>
        <div className="flex gap-2">
          <label className={`cursor-pointer ${buttonClass("secondary")}`}>
            {t("upload.pick_files")}
            <input
              type="file"
              multiple
              className="sr-only"
              data-testid="pick-files"
              onChange={(e) => void add(filesFromInput(e.target.files))}
            />
          </label>
          <Button variant="secondary" onClick={() => folderInput.current?.click()}>
            {t("upload.pick_folder")}
          </Button>
          <input
            ref={(node) => {
              folderInput.current = node;
              node?.setAttribute("webkitdirectory", "");
            }}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => void add(filesFromInput(e.target.files))}
          />
        </div>
      </section>
      {hashing && <Spinner label={t("upload.hashing")} />}
      {error ? <ErrorBox error={error} /> : null}
      {sent && <Notice>✓ {t("upload.sent")}</Notice>}
      {copies.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-marker/60 bg-marker-soft p-4 text-sm">
          <p>
            <strong>{t("upload.copies_title", { count: copies.length })}</strong>{" "}
            {t("upload.copies_detail", {
              batch: copiesInBatch,
              library: copies.length - copiesInBatch,
            })}
          </p>
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={includeCopies}
              onChange={(e) => setIncludeCopies(e.target.checked)}
            />
            {t("upload.include_copies")}
          </label>
        </div>
      )}
      {rows.length > 0 && (
        <Card
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setRows([])}>
                {t("upload.clear")}
              </Button>
              <Button onClick={send} disabled={sending || entries.length === 0}>
                {sending
                  ? progress
                    ? t("upload.sending_progress", progress)
                    : t("upload.sending")
                  : t("upload.send", { count: entries.length })}
              </Button>
            </div>
          }
        >
          <ul className="divide-y divide-line text-sm">
            {rows.map((row) => (
              <li
                key={`${row.path}-${row.entry?.sha256 ?? row.state}`}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs">{row.path}</span>
                  {row.copyOf && (
                    <span className="block truncate text-xs text-muted">
                      {t("upload.copy_of", { name: row.copyOf })}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted">{formatBytes(row.size)}</span>
                  <Badge
                    tone={
                      row.state === "new"
                        ? "ok"
                        : row.state === "known" || (includeCopies && row.copyEntry !== undefined)
                          ? "info"
                          : "warn"
                    }
                  >
                    {t(`upload.state.${row.state}`)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
