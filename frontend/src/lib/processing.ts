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
