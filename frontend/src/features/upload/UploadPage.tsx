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

type State = "new" | "known" | "too_big" | "junk" | "ignored_dir" | "invalid" | "duplicate";

interface Row {
  path: string;
  size: number;
  state: State;
  entry?: UploadEntry;
}

export async function prepareUpload(
  files: PickedFile[],
  known: (sha: string) => boolean,
): Promise<Row[]> {
  const rows: Row[] = [];
  const seen = new Set<string>();
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
    const key = `${path}:${sha256}`;
    if (seen.has(key)) {
      rows.push({ path, size, state: "duplicate" });
      continue;
    }
    seen.add(key);
    const reused = known(sha256);
    rows.push({
      path,
      size,
      state: reused ? "known" : "new",
      entry: { relativePath: path, sha256, ...(reused ? {} : { bytes }) },
    });
  }
  return rows;
}

export function UploadPage() {
  const { t } = useTranslation();
  const { source, meta, notifyCommit } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [hashing, setHashing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [over, setOver] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);

  async function add(files: PickedFile[]) {
    setSent(false);
    setError(null);
    setHashing(true);
    try {
      const prepared = await prepareUpload(files, (sha) => meta?.knownSha(sha) ?? false);
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

  const entries = rows.flatMap((r) => (r.entry ? [r.entry] : []));

  async function send() {
    setSending(true);
    setError(null);
    try {
      await source.upload(entries, newBatchId());
      setRows([]);
      setSent(true);
      notifyCommit();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
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
      {rows.length > 0 && (
        <Card
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setRows([])}>
                {t("upload.clear")}
              </Button>
              <Button onClick={send} disabled={sending || entries.length === 0}>
                {sending ? t("upload.sending") : t("upload.send", { count: entries.length })}
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
                <span className="truncate font-mono text-xs">{row.path}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted">{formatBytes(row.size)}</span>
                  <Badge
                    tone={row.state === "new" ? "ok" : row.state === "known" ? "info" : "warn"}
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
