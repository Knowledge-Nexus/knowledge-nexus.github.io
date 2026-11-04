// Abrir uma sessão: com o token do GitHub (o dono), com um código de acesso (KN1-…) ou com uma
// conta (pelo Worker das contas, que fala com o GitHub e impõe o papel).

import { AccountsApi, type AccountUser } from "../../data/accounts";
import { type FetchLike, GitHubClient, GitHubError } from "../../data/github/client";
import type { StoredSession } from "../../data/session";
import { GitHubDataSource } from "../../data/source";
import { tokenFingerprint } from "../../lib/access";

export interface Connected {
  session: StoredSession;
  source: GitHubDataSource;
}

/** Conta sem acesso (ainda à espera, suspensa ou fora de prazo): só o material público. */
export class AccountWaiting extends Error {
  constructor(readonly user: AccountUser) {
    super("account_waiting");
  }
}

async function connectAccount(session: StoredSession, fetchImpl?: FetchLike): Promise<Connected> {
  const base = session.account!.api;
  const api = new AccountsApi(base, fetchImpl);
  let me: Awaited<ReturnType<AccountsApi["me"]>>;
  try {
    me = await api.me(session.token);
  } catch (error) {
    if ((error as { status?: number }).status === 401) throw new Error("account_signed_out");
    throw error;
  }
  if (me.user.access === "none") throw new AccountWaiting(me.user);
  const [owner = "", name = ""] = me.repo.split("/");
  const client = new GitHubClient(session.token, fetchImpl, `${base}/gh`);
  const login = (await client.user()).login;
  const info = await client.repo(owner, name);
  const repo = { owner, name, branch: info.default_branch || "main" };
  const source = new GitHubDataSource(client, repo, login, info, undefined, {
    api,
    token: session.token,
    user: me.user,
  });
  return { session: { ...session, owner, name, branch: repo.branch }, source };
}

/** Valida o token e o repositório. Recusa repositórios públicos (direitos de autor). */
export async function connect(session: StoredSession, fetchImpl?: FetchLike): Promise<Connected> {
  if (session.account) return connectAccount(session, fetchImpl);
  const client = new GitHubClient(session.token, fetchImpl);
  let login: string;
  try {
    login = (await client.user()).login;
  } catch (error) {
    if (error instanceof GitHubError && error.status === 401) throw new Error("unauthorized");
    throw error;
  }
  let info: Awaited<ReturnType<GitHubClient["repo"]>>;
  try {
    info = await client.repo(session.owner, session.name);
  } catch (error) {
    if (error instanceof GitHubError && (error.status === 404 || error.status === 403))
      throw new Error("not_found");
    throw error;
  }
  if (!info.private) throw new Error("public");
  // «Só ver e descarregar» não precisa (nem deve ter) escrita.
  if (session.guest?.scope !== "read" && info.permissions && info.permissions.push === false)
    throw new Error("no_push");
  const branch = info.default_branch || session.branch || "main";
  const repo = { owner: session.owner, name: session.name, branch };
  const guest = session.guest
    ? { ...session.guest, token_sha256: await tokenFingerprint(session.token) }
    : undefined;
  const source = new GitHubDataSource(client, repo, login, info, guest);
  if (guest) {
    // O dono pode ter suspendido ou terminado este acesso (Definições → «Acessos que deste»).
    const { state } = await source.guestAccess();
    if (state !== "active") throw new Error(`access_${state}`);
  }
  return { session: { ...session, branch, ...(guest ? { guest } : {}) }, source };
}
