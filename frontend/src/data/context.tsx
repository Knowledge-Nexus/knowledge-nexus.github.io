// Estado partilhado: sessão, fonte de dados, índices (SQLite) e estado do pipeline.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gunzipSync } from "fflate";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { WorkflowRun } from "./github/client";
import type { DataSource } from "./source";
import { ReadonlyDb } from "./sqlite/db";
import { MetaIndex, MIN_SCHEMA_VERSION, SUPPORTED_SCHEMA_VERSION } from "./sqlite/queries";
import { SearchIndex } from "./sqlite/search";
import type { IndexManifest } from "./types";

interface AppData {
  source: DataSource;
  login: string;
  /** Modo de visitante (material público): nada se edita. */
  readOnly: boolean;
  /** Prefixo das rotas ("" ou "/publico"); usar `to()` nos links internos. */
  base: string;
  to: (path: string) => string;
  manifest: IndexManifest | null | undefined;
  meta: MetaIndex | null;
  indexLoading: boolean;
  indexError: Error | null;
  runs: WorkflowRun[];
  activeRun: WorkflowRun | undefined;
  pending: number;
  notifyCommit: () => void;
  refresh: () => void;
  logout: () => void;
}

const AppContext = createContext<AppData | null>(null);

export function useApp(): AppData {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp fora do DataProvider");
  return value;
}

const ACTIVE = new Set(["queued", "in_progress", "waiting", "requested", "pending"]);

export function DataProvider(props: {
  source: DataSource;
  onLogout: () => void;
  readOnly?: boolean;
  base?: string;
  children: ReactNode;
}) {
  const { source } = props;
  const readOnly = props.readOnly ?? false;
  const base = props.base ?? "";
  const queryClient = useQueryClient();
  const [pendingSince, setPendingSince] = useState<number | null>(null);

  const runsQuery = useQuery({
    queryKey: ["runs", source.repo],
    queryFn: () => source.runs(),
    enabled: !readOnly,
    refetchInterval: (query) => {
      const runs = query.state.data ?? [];
      return runs.some((r) => ACTIVE.has(r.status)) || pendingSince ? 8000 : 60000;
    },
  });
  const runs = runsQuery.data ?? [];
  const activeRun = runs.find((r) => ACTIVE.has(r.status));

  const manifestQuery = useQuery({
    queryKey: ["manifest", source.repo],
    queryFn: () => source.manifest(),
    refetchInterval: activeRun || pendingSince ? 10000 : 120000,
  });
  const manifest = manifestQuery.data;
  const metaSha = manifest?.files["meta.db"]?.sha256;

  if (pendingSince && manifest && Date.parse(manifest.built_at) > pendingSince) {
    setPendingSince(null);
  }

  const metaQuery = useQuery({
    queryKey: ["meta", metaSha],
    enabled: Boolean(metaSha),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const meta = new MetaIndex(
        await ReadonlyDb.open(await source.indexFile("meta.db", metaSha!)),
      );
      const version = meta.schemaVersion();
      if (version < MIN_SCHEMA_VERSION || version > SUPPORTED_SCHEMA_VERSION) {
        throw new Error(
          `índice com esquema ${meta.schemaVersion()}, esta interface suporta o ${SUPPORTED_SCHEMA_VERSION}`,
        );
      }
      return meta;
    },
  });

  const notifyCommit = useCallback(() => {
    setPendingSince(Date.now() - 5000);
    void queryClient.invalidateQueries({ queryKey: ["runs"] });
  }, [queryClient]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["manifest"] });
    void queryClient.invalidateQueries({ queryKey: ["runs"] });
  }, [queryClient]);

  const value = useMemo<AppData>(
    () => ({
      source,
      login: source.login,
      readOnly,
      base,
      to: (path: string) => `${base}${path}`,
      manifest,
      meta: metaQuery.data ?? null,
      indexLoading: manifestQuery.isLoading || metaQuery.isLoading,
      indexError: (manifestQuery.error as Error | null) ?? (metaQuery.error as Error | null),
      runs,
      activeRun,
      pending: pendingSince ? 1 : 0,
      notifyCommit,
      refresh,
      logout: props.onLogout,
    }),
    [
      source,
      readOnly,
      base,
      manifest,
      metaQuery.data,
      metaQuery.isLoading,
      metaQuery.error,
      manifestQuery.isLoading,
      manifestQuery.error,
      runs,
      activeRun,
      pendingSince,
      notifyCommit,
      refresh,
      props.onLogout,
    ],
  );
  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}

/** Índice de pesquisa: carregado só quando é preciso (pode ser maior). */
export function useSearchIndex() {
  const { source, manifest } = useApp();
  const compressedName = "pesquisa.db.gz";
  const searchName = manifest?.files[compressedName]
    ? compressedName
    : manifest?.files["pesquisa.db"]
      ? "pesquisa.db"
      : null;
  const sha = searchName ? manifest?.files[searchName]?.sha256 : undefined;
  return useQuery({
    queryKey: ["search-index", sha],
    enabled: Boolean(sha),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!searchName || !sha) throw new Error("manifesto sem índice de pesquisa");
      const bytes = await source.indexFile(searchName, sha);
      const database = searchName === compressedName ? gunzipSync(bytes) : bytes;
      return new SearchIndex(await ReadonlyDb.open(database));
    },
  });
}
