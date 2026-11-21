// Estado partilhado: sessão, fonte de dados, índices (SQLite) e estado do pipeline.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gunzipSync } from "fflate";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { queuedItems } from "../lib/processing";
import { type Capabilities, FULL, READ_AND_DOWNLOAD, writes } from "../lib/ranks";
import type { WorkflowRun } from "./github/client";
import type { DataSource } from "./source";
import { ReadonlyDb } from "./sqlite/db";
import { MetaIndex, MIN_SCHEMA_VERSION, SUPPORTED_SCHEMA_VERSION } from "./sqlite/queries";
import { SearchIndex, searchFiles } from "./sqlite/search";
import type { IndexManifest } from "./types";

interface AppData {
  source: DataSource;
  login: string;
  /** Nada se arruma nem corrige (só ver; ou, no máximo, depositar). */
  readOnly: boolean;
  /** O que esta sessão pode fazer (descarregar, depositar, arrumar, publicar, configurar). */
  can: Capabilities;
  /** Nome de quem vê por cima das páginas (contas que não descarregam), ou null. */
  watermark: string | null;
  /** Visitante da página pública (sem sessão): só o material público. */
  visitor: boolean;
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
  /**
   * Há trabalho por fazer que os índices ainda não reflectem: alterações recentes no
   * repositório (as marcas de leitura não contam) ou itens do depósito ainda por tratar.
   */
  processing: boolean;
  /** Desde quando (ms) não se vê progresso enquanto há trabalho; null sem trabalho. */
  processingSince: number | null;
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
/** De quanto em quanto tempo se compara o último commit com o dos índices. */
export const LAG_INTERVAL_MS = 20_000;

export function DataProvider(props: {
  source: DataSource;
  onLogout: () => void;
  readOnly?: boolean;
  can?: Capabilities;
  watermark?: string | null;
  visitor?: boolean;
  base?: string;
  children: ReactNode;
}) {
  const { source } = props;
  const visitor = props.visitor ?? false;
  const can = props.can ?? (visitor || props.readOnly ? READ_AND_DOWNLOAD : FULL);
  const readOnly = visitor || !can.organize;
  const watermark = props.watermark ?? null;
  const base = props.base ?? "";
  const queryClient = useQueryClient();
  const [pendingSince, setPendingSince] = useState<number | null>(null);

  const runsQuery = useQuery({
    queryKey: ["runs", source.repo],
    queryFn: () => source.runs(),
    enabled: !visitor && writes(can),
    refetchInterval: (query) => {
      const runs = query.state.data ?? [];
      return runs.some((r) => ACTIVE.has(r.status)) || pendingSince ? 8000 : 60000;
    },
  });
  const runs = runsQuery.data ?? [];
  const activeRun = runs.find((r) => ACTIVE.has(r.status));

  const [lastProcessing, setLastProcessing] = useState(false);
  const manifestQuery = useQuery({
    queryKey: ["manifest", source.repo],
    queryFn: () => source.manifest(),
    refetchInterval: activeRun || pendingSince || lastProcessing ? 10000 : 120000,
  });
  const manifest = manifestQuery.data;
  const metaSha = manifest?.files["meta.db"]?.sha256;

  if (pendingSince && manifest && Date.parse(manifest.built_at) > pendingSince) {
    setPendingSince(null);
  }

  // O último commit comparado com o dos índices (o processamento local não aparece no
  // Actions): com o mesmo commit, cada verificação é um pedido pequeno.
  const builtFrom = manifest?.built_from ?? null;
  const lagQuery = useQuery({
    queryKey: ["lag", source.repo, builtFrom],
    queryFn: () => source.lag!(builtFrom!),
    enabled: Boolean(source.lag && builtFrom) && !visitor && writes(can),
    refetchInterval: LAG_INTERVAL_MS,
    // Ao voltar ao separador o estado é logo o actual (em segundo plano não se verifica).
    refetchOnWindowFocus: true,
  });
  const processing = Boolean(lagQuery.data?.pending) || queuedItems(manifest?.deposit) > 0;
  if (processing !== lastProcessing) setLastProcessing(processing);

  // Progresso: o processamento começou ou os índices mudaram desde então.
  const [progress, setProgress] = useState<{ since: number; builtAt: string } | null>(null);
  const builtAt = manifest?.built_at ?? "";
  if (!processing && progress) setProgress(null);
  if (processing && (!progress || progress.builtAt !== builtAt)) {
    setProgress({ since: Date.now(), builtAt });
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
    void queryClient.invalidateQueries({ queryKey: ["lag"] });
  }, [queryClient]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["manifest"] });
    void queryClient.invalidateQueries({ queryKey: ["runs"] });
    void queryClient.invalidateQueries({ queryKey: ["lag"] });
  }, [queryClient]);

  const value = useMemo<AppData>(
    () => ({
      source,
      login: source.login,
      readOnly,
      can,
      watermark,
      visitor,
      base,
      to: (path: string) => `${base}${path}`,
      manifest,
      meta: metaQuery.data ?? null,
      indexLoading: manifestQuery.isLoading || metaQuery.isLoading,
      indexError: (manifestQuery.error as Error | null) ?? (metaQuery.error as Error | null),
      runs,
      activeRun,
      pending: pendingSince ? 1 : 0,
      processing,
      processingSince: progress?.since ?? null,
      notifyCommit,
      refresh,
      logout: props.onLogout,
    }),
    [
      source,
      readOnly,
      can,
      watermark,
      visitor,
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
      processing,
      progress,
      notifyCommit,
      refresh,
      props.onLogout,
    ],
  );
  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}

/**
 * Índice de pesquisa: carregado só quando é preciso (é o maior). Vem em partes; cada uma fica
 * na cache pelo seu SHA-256, por isso depois de uma actualização só se descarregam as que
 * mudaram.
 */
export function useSearchIndex() {
  const { source, manifest } = useApp();
  const files = manifest ? searchFiles(manifest.files, manifest.search?.shards) : [];
  const shas = files.map((name) => manifest?.files[name]?.sha256 ?? "");
  return useQuery({
    queryKey: ["search-index", shas.join(",")],
    enabled: files.length > 0 && shas.every(Boolean),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (files.length === 0) throw new Error("manifesto sem índice de pesquisa");
      const shards = await Promise.all(
        files.map(async (name, i) => {
          const bytes = await source.indexFile(name, shas[i]!);
          return ReadonlyDb.open(name.endsWith(".gz") ? gunzipSync(bytes) : bytes);
        }),
      );
      return new SearchIndex(shards);
    },
  });
}
