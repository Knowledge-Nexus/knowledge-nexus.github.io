// As marcas de leitura de quem está na sessão: carregar, editar (com desfazer) e gravar.
//
// Grava sozinho uns segundos depois da última alteração (um commit por série de traços, não
// um por traço) e ao sair do modo de leitura. Até lá, fica um rascunho neste browser: se a
// página fechar antes de gravar, o rascunho vai na próxima vez que se abrir o documento.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../data/context";
import type { DataSource } from "../../data/source";
import type { DocumentRow } from "../../data/types";
import {
  type AnnotationFile,
  emptyAnnotations,
  type MarkHistory,
  type PageMarks,
  parseAnnotations,
  pushHistory,
  redoHistory,
  startHistory,
  stringifyAnnotations,
  undoHistory,
} from "../../lib/annotations";

export const SAVE_DELAY_MS = 5000;
const RETRY_DELAY_MS = 30_000;

export type SaveState = "saved" | "pending" | "saving" | "error";

export interface LoadedMarks {
  file: AnnotationFile;
  /** Há um rascunho deste browser por gravar. */
  unsaved: boolean;
}

function scope(source: DataSource): string {
  const dir = (source as { annotationsDir?: string }).annotationsDir ?? source.login;
  return `${source.repo.owner}/${source.repo.name}/${dir}`;
}

const draftKey = (source: DataSource, docId: string) =>
  `nexus.marcas.rascunho.${scope(source)}.${docId}`;

function readDraft(source: DataSource, docId: string): AnnotationFile | null {
  try {
    return parseAnnotations(localStorage.getItem(draftKey(source, docId)));
  } catch {
    return null;
  }
}

function writeDraft(source: DataSource, file: AnnotationFile | null): void {
  if (!file) return;
  try {
    localStorage.setItem(draftKey(source, file.document), stringifyAnnotations(file));
  } catch {
    // sem armazenamento: grava-se só no repositório
  }
}

function dropDraft(source: DataSource, docId: string): void {
  try {
    localStorage.removeItem(draftKey(source, docId));
  } catch {
    // sem armazenamento
  }
}

export const marksKey = (source: DataSource, docId: string) => [
  "annotations",
  scope(source),
  docId,
];

/** As marcas gravadas (ou o rascunho deste browser, se for mais recente). */
export function useSavedMarks(doc: DocumentRow | undefined) {
  const { source } = useApp();
  return useQuery({
    queryKey: marksKey(source, doc?.id ?? ""),
    enabled: Boolean(doc),
    staleTime: 60_000,
    queryFn: async (): Promise<LoadedMarks> => {
      const remote = await source.annotations(doc!.id);
      const draft = readDraft(source, doc!.id);
      if (draft && (!remote || draft.updated_at > remote.updated_at))
        return { file: draft, unsaved: true };
      return { file: remote ?? emptyAnnotations(doc!.id, doc!.sha256), unsaved: false };
    },
  });
}

/** Editor das marcas (só no modo de leitura, depois de carregadas). */
export function useMarkEditor(doc: DocumentRow, loaded: LoadedMarks) {
  const { source } = useApp();
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<MarkHistory>(() => startHistory(loaded.file.pages));
  const [state, setState] = useState<SaveState>(loaded.unsaved ? "pending" : "saved");
  const latest = useRef<PageMarks>(loaded.file.pages);
  const dirty = useRef(loaded.unsaved);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current || saving.current) return;
    saving.current = true;
    dirty.current = false;
    setState("saving");
    const file: AnnotationFile = {
      ...emptyAnnotations(doc.id, doc.sha256),
      updated_at: new Date().toISOString(),
      pages: latest.current,
    };
    try {
      await source.saveAnnotations(file);
      queryClient.setQueryData<LoadedMarks>(marksKey(source, doc.id), { file, unsaved: false });
      if (dirty.current) {
        timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
        setState("pending");
      } else {
        dropDraft(source, doc.id);
        setState("saved");
      }
    } catch {
      dirty.current = true;
      setState("error");
      timer.current = setTimeout(() => void flush(), RETRY_DELAY_MS);
    } finally {
      saving.current = false;
    }
  }, [doc.id, doc.sha256, queryClient, source]);

  const changed = useCallback(
    (pages: PageMarks) => {
      latest.current = pages;
      dirty.current = true;
      setState("pending");
      const file = {
        ...emptyAnnotations(doc.id, doc.sha256),
        updated_at: new Date().toISOString(),
        pages,
      };
      writeDraft(source, file);
      queryClient.setQueryData<LoadedMarks>(marksKey(source, doc.id), { file, unsaved: true });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [doc.id, doc.sha256, flush, queryClient, source],
  );

  // Um rascunho que ficou por gravar da última vez vai agora.
  useEffect(() => {
    if (dirty.current) timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
  }, [flush]);

  // Ao sair do modo de leitura, ou se a página ficar escondida, grava-se já.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush]);

  return {
    marks: history.present,
    state,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    change(next: PageMarks) {
      setHistory(pushHistory(history, next));
      changed(next);
    },
    undo() {
      if (!history.past.length) return;
      const next = undoHistory(history);
      setHistory(next);
      changed(next.present);
    },
    redo() {
      if (!history.future.length) return;
      const next = redoHistory(history);
      setHistory(next);
      changed(next.present);
    },
    flush,
  };
}
