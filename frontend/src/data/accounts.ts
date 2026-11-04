// Contas (Worker do Cloudflare com D1, ver worker/src/accounts.js): registo, entrada, sessão,
// convites e, para o dono, a gestão das contas. Quem entra com conta usa a API do GitHub
// através do Worker (`/gh`), com a sessão em vez de um token do GitHub.

import type { AccountRole } from "../lib/ranks";
import { STORAGE_URL } from "./source";

export type { AccountRole } from "../lib/ranks";

/** Worker das contas: o mesmo dos originais no R2 (vazio desliga as contas). */
export const ACCOUNTS_URL: string =
  (import.meta.env.VITE_ACCOUNTS_URL as string | undefined) ?? STORAGE_URL;

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
  status: "active" | "paused";
  until: string | null;
  /** O papel que vale agora (suspenso ou fora de prazo: `none`). */
  access: AccountRole;
  google: boolean;
  password: boolean;
  created_at: string;
  last_seen_at: string | null;
}

export interface AccountsConfig {
  enabled: boolean;
  google: boolean;
  signup: boolean;
  repo: string;
}

export interface SignedIn {
  token: string;
  user: AccountUser;
}

export interface AccountInvite {
  id: string;
  role: AccountRole;
  label: string | null;
  until: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  used_by_name: string | null;
  used_by_email: string | null;
}

/** Erro do Worker: `code` é a chave da mensagem (`accounts.errors.<code>`). */
export class AccountError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
const defaultFetch: FetchLike = (input, init) => fetch(input, init);

export class AccountsApi {
  constructor(
    readonly base: string = ACCOUNTS_URL,
    private readonly fetchImpl: FetchLike = defaultFetch,
  ) {}

  private async call<T>(method: string, path: string, token?: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.base}/contas${path}`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== undefined
          ? { body: typeof body === "string" ? body : JSON.stringify(body) }
          : {}),
        cache: "no-store",
      });
    } catch {
      throw new AccountError(0, "sem_ligacao");
    }
    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      const code = (data as { error?: string } | null)?.error ?? `http_${response.status}`;
      throw new AccountError(response.status, code);
    }
    return data as T;
  }

  /** O que o Worker oferece (null se não houver contas: Worker antigo ou sem ligação). */
  async config(): Promise<AccountsConfig | null> {
    if (!this.base) return null;
    try {
      const config = await this.call<AccountsConfig>("GET", "/config");
      return config?.enabled ? config : null;
    } catch {
      return null;
    }
  }

  signUp(data: { email: string; name: string; password: string; invite?: string }) {
    return this.call<SignedIn>("POST", "/registar", undefined, data);
  }

  signIn(email: string, password: string) {
    return this.call<SignedIn>("POST", "/entrar", undefined, { email, password });
  }

  /** Endereço para «Entrar com Google» (volta a esta página com um código de uso único). */
  googleUrl(back: string, invite?: string): string {
    const params = new URLSearchParams({ volta: back, ...(invite ? { convite: invite } : {}) });
    return `${this.base}/contas/google?${params}`;
  }

  googleExchange(code: string) {
    return this.call<SignedIn>("POST", "/google/troca", undefined, { code });
  }

  me(token: string) {
    return this.call<{ user: AccountUser; repo: string; owner: string | null }>(
      "GET",
      "/eu",
      token,
    );
  }

  updateMe(token: string, patch: { name?: string; password?: string; current?: string }) {
    return this.call<{ user: AccountUser }>("PATCH", "/eu", token, patch);
  }

  signOut(token: string) {
    return this.call<{ ok: boolean }>("POST", "/sair", token);
  }

  inviteInfo(code: string) {
    return this.call<{ role: AccountRole; label: string | null; until: string | null }>(
      "GET",
      `/convite/${encodeURIComponent(code.trim())}`,
    );
  }

  acceptInvite(token: string, code: string) {
    return this.call<{ user: AccountUser }>("POST", "/convite", token, { code: code.trim() });
  }

  resetPassword(code: string, password: string) {
    return this.call<SignedIn>("POST", "/repor", undefined, { code: code.trim(), password });
  }

  /** Marcas de leitura desta conta (null se ainda não houver). */
  async marks(token: string, document: string): Promise<string | null> {
    try {
      return JSON.stringify(
        await this.call<unknown>("GET", `/marcas/${encodeURIComponent(document)}`, token),
      );
    } catch (error) {
      if (error instanceof AccountError && error.status === 404) return null;
      throw error;
    }
  }

  saveMarks(token: string, document: string, body: string) {
    return this.call<{ ok: boolean }>(
      "PUT",
      `/marcas/${encodeURIComponent(document)}`,
      token,
      body,
    );
  }

  // --- só o dono (com o token dele do GitHub) -----------------------------------------------

  users(githubToken: string) {
    return this.call<{ users: AccountUser[] }>("GET", "/admin/contas", githubToken);
  }

  updateUser(
    githubToken: string,
    id: string,
    patch: Partial<Pick<AccountUser, "role" | "status" | "until" | "name">>,
  ) {
    return this.call<{ user: AccountUser }>("PATCH", `/admin/contas/${id}`, githubToken, patch);
  }

  removeUser(githubToken: string, id: string) {
    return this.call<{ ok: boolean }>("DELETE", `/admin/contas/${id}`, githubToken);
  }

  resetLink(githubToken: string, id: string) {
    return this.call<{ code: string; expires_at: string }>(
      "POST",
      `/admin/contas/${id}/repor`,
      githubToken,
    );
  }

  invites(githubToken: string) {
    return this.call<{ invites: AccountInvite[] }>("GET", "/admin/convites", githubToken);
  }

  createInvite(
    githubToken: string,
    data: { role: AccountRole; label?: string; until?: string | null },
  ) {
    return this.call<{ invite: AccountInvite; code: string }>(
      "POST",
      "/admin/convites",
      githubToken,
      data,
    );
  }

  removeInvite(githubToken: string, id: string) {
    return this.call<{ ok: boolean }>("DELETE", `/admin/convites/${id}`, githubToken);
  }
}

/** Ligações que o dono envia: convite e repor a palavra-passe (no site, não no Worker). */
export function siteLink(path: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${path}`;
}

/** Quem está na sessão com uma conta (vai na fonte de dados). */
export interface AccountSession {
  api: AccountsApi;
  token: string;
  user: AccountUser;
}
