// O que cada pessoa pode fazer na interface. O Worker impõe o mesmo do lado dele
// (worker/src/ranks.js): aqui só se escondem os botões que não serviriam.

export const ACCOUNT_RANKS = [
  "viewer",
  "reader",
  "contributor",
  "organizer",
  "editor",
  "manager",
] as const;
export type AccountRank = (typeof ACCOUNT_RANKS)[number];
/** `none`: conta criada, à espera de acesso. */
export type AccountRole = "none" | AccountRank;

export interface Capabilities {
  /** Descarregar originais (um a um ou em zip). */
  download: boolean;
  /** Depositar material novo. */
  upload: boolean;
  /** Arrumar: «A rever», classificação, nomes, cadeiras, cursos, conjuntos, remover. */
  organize: boolean;
  /** Escolher o que é público. */
  visibility: boolean;
  /** Configuração do repositório (assistente inicial). Só o dono e os códigos de acesso. */
  configure: boolean;
}

export const FULL: Capabilities = {
  download: true,
  upload: true,
  organize: true,
  visibility: true,
  configure: true,
};

/** Visitante da página pública e código «só ver e descarregar». */
export const READ_AND_DOWNLOAD: Capabilities = {
  download: true,
  upload: false,
  organize: false,
  visibility: false,
  configure: false,
};

const LEVEL: Record<AccountRole, number> = {
  none: 0,
  viewer: 1,
  reader: 2,
  contributor: 3,
  organizer: 4,
  editor: 5,
  manager: 6,
};

export function rankCapabilities(role: AccountRole): Capabilities {
  const level = LEVEL[role] ?? 0;
  return {
    download: level >= LEVEL.reader,
    upload: level >= LEVEL.contributor,
    organize: level >= LEVEL.organizer,
    visibility: level >= LEVEL.editor,
    configure: false,
  };
}

/** Gere as contas (Definições): o dono e os Gestores, estes até ao nível Editor. */
export const managesAccounts = (role: AccountRole) => role === "manager";

/** Grava alguma coisa no repositório (para o estado do processamento e os commits). */
export const writes = (can: Capabilities) => can.upload || can.organize;
