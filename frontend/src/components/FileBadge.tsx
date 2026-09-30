// Ícone de ficheiro com a etiqueta do formato (PDF, DOC, XLS…), com as cores do formato.

const FORMATS: { label: string; color: string; exts: string[] }[] = [
  { label: "PDF", color: "var(--color-file-pdf)", exts: ["pdf"] },
  { label: "DOC", color: "var(--color-file-doc)", exts: ["doc", "docx", "odt", "rtf"] },
  { label: "XLS", color: "var(--color-file-xls)", exts: ["xls", "xlsx", "xlsm", "ods", "csv"] },
  { label: "PPT", color: "var(--color-file-ppt)", exts: ["ppt", "pptx", "pps", "ppsx", "odp"] },
  {
    label: "IMG",
    color: "var(--color-file-img)",
    exts: ["png", "jpg", "jpeg", "gif", "webp", "heic", "heif", "tif", "tiff", "bmp"],
  },
  { label: "ZIP", color: "var(--color-file-zip)", exts: ["zip", "rar", "7z", "tar", "gz"] },
  { label: "TXT", color: "var(--color-file-txt)", exts: ["txt", "md", "tex", "rst", "log"] },
];

export function fileFormat(ext: string, kind: string): { label: string; color: string } {
  if (kind === "code_project") return { label: "</>", color: "var(--color-file-code)" };
  if (kind === "archive") return { label: "ZIP", color: "var(--color-file-zip)" };
  const found = FORMATS.find((f) => f.exts.includes(ext.toLowerCase()));
  if (found) return found;
  if (ext) return { label: ext.slice(0, 4).toUpperCase(), color: "var(--color-file-code)" };
  return { label: "?", color: "var(--color-file-txt)" };
}

export function FileBadge(props: { ext: string; kind: string }) {
  const { label, color } = fileFormat(props.ext, props.kind);
  return (
    <span
      className="relative flex h-10 w-8 shrink-0 items-end justify-center rounded-md border border-line bg-sheet pb-1 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      aria-hidden="true"
    >
      <span
        className="absolute top-0 right-0 h-2.5 w-2.5 rounded-bl-sm border-b border-l border-line bg-paper"
        style={{ borderTopRightRadius: "0.3rem" }}
      />
      <span
        className="rounded-sm px-1 text-[0.55rem] font-bold leading-4 tracking-wide text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    </span>
  );
}
