// Sessão local: repositório de dados + token. O token fica APENAS neste browser:
// em sessionStorage por defeito, ou em localStorage se o utilizador pedir "lembrar".

export interface StoredSession {
  owner: string;
  name: string;
  branch: string;
  token: string;
  remember: boolean;
}

const KEY = "nexus.session";

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
