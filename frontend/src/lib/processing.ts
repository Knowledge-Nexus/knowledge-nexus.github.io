// O que o processamento trata e o estado do depósito tal como os índices o descrevem.

import type { DepositState } from "../data/types";

/**
 * Os caminhos que o processamento trata: os mesmos `paths` do workflow do repositório de dados
 * (`backend/nexus/scaffold/template/.github/workflows/nexus.yml`; um teste confirma que são
 * iguais). As marcas de leitura (`anotacoes/`) e os acessos (`acessos.yaml`) não contam.
 */
export const PIPELINE_PATHS = [
  "deposito/",
  "documentos/",
  "catalogo/",
  "utilizadores/",
  "revisao/",
  "gerado/",
  "nexus.yaml",
] as const;

/**
 * Arquivos que o motor guarda inteiros, sem os abrir (`archives.keep_whole` em
 * `config/predefinicoes.yaml`; um teste confirma que são os mesmos). No envio, «Extrair os
 * ficheiros» pede para os abrir.
 */
export const KEEP_WHOLE_EXTS = ["rar"] as const;

export function keptWhole(path: string): boolean {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  return (KEEP_WHOLE_EXTS as readonly string[]).includes(ext);
}

export function needsProcessing(paths: readonly string[]): boolean {
  return paths.some((path) =>
    PIPELINE_PATHS.some((p) => (p.endsWith("/") ? path.startsWith(p) : path === p)),
  );
}

/** Itens que ainda vão ser tratados (os parados, com razão, não contam). */
export function queuedItems(deposit: DepositState | undefined): number {
  return deposit ? Math.max(0, deposit.waiting_total - deposit.stuck_total) : 0;
}

/** Quantos problemas há para mostrar ao dono (ficheiros parados ou que falharam). */
export function problemCount(deposit: DepositState | undefined): number {
  if (!deposit) return 0;
  return deposit.stuck_total + deposit.failed_total + deposit.catalog_failed.length;
}
