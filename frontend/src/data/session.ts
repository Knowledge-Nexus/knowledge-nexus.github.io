import type { AccessScope } from "../lib/invite";

// Sessão local: repositório de dados + token. O token fica APENAS neste browser:
// em sessionStorage por defeito, ou em localStorage se o utilizador pedir "lembrar".

export interface StoredSession {
  owner: string;
  name: string;
  branch: string;
  token: string;
  remember: boolean;
  /** Entrada com um código de acesso temporário (ver `lib/invite.ts`). */
  guest?: GuestInfo;
}

export interface GuestInfo {
  name: string;
  until?: string;
  /** SHA-256 do token: identifica o acesso no registo `acessos.yaml` (`lib/access.ts`). */
  token_sha256?: string;
  /** «Só ver e descarregar» (`read`) ou acesso total (sem campo). */
  scope?: AccessScope;
}

const KEY = "nexus.session";
const FLASH = "nexus.aviso";

/** Mensagem para o ecrã de entrada depois de uma saída forçada (ex.: acesso suspenso). */
export function setFlash(code: string): void {
  try {
    sessionStorage.setItem(FLASH, code);
  } catch {
    // sem armazenamento: a pessoa volta só ao ecrã de entrada
  }
}

/** Há uma mensagem à espera (sem a gastar): a saída vai para o ecrã de entrada. */
export function hasFlash(): boolean {
  try {
    return sessionStorage.getItem(FLASH) !== null;
  } catch {
    return false;
  }
}

export function takeFlash(): string | null {
  try {
    const code = sessionStorage.getItem(FLASH);
    sessionStorage.removeItem(FLASH);
    return code;
  } catch {
    return null;
  }
}

function read(storage: Storage | undefined): StoredSession | null {
  try {
    const raw = storage?.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function loadSession(): StoredSession | null {
  return read(globalThis.sessionStorage) ?? read(globalThis.localStorage);
}

export function saveSession(session: StoredSession): void {
  clearSession();
  try {
    const storage = session.remember ? localStorage : sessionStorage;
    storage.setItem(KEY, JSON.stringify(session));
  } catch {
    // armazenamento indisponível: a sessão dura só enquanto a página estiver aberta
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    // nada a fazer
  }
}

export function parseRepo(value: string): { owner: string; name: string } | null {
  const cleaned = value
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/+$/, "");
  const match = /^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/.exec(cleaned);
  return match ? { owner: match[1]!, name: match[2]! } : null;
}
