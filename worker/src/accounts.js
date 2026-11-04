// Contas do Knowledge Nexus (D1): registo e entrada (email e palavra-passe, ou Google),
// sessões, papéis, convites e as marcas de leitura de cada pessoa.
//
// Níveis de acesso: ver `ranks.js` (de `none`, à espera, até `editor`). Só o dono vê e gere
// as contas, com o token dele do GitHub (o mesmo com que entra como administrador); um Gestor
// também, com a sessão dele, até ao nível Editor.

import { handleCodes } from "./codes.js";
import { adminLogin, dataRepo, githubConfigured, ownerLogin } from "./github.js";
import { atLeast, isRank } from "./ranks.js";
import {
  bearer,
  checkPassword,
  cors,
  digest,
  HttpError,
  hashPassword,
  list,
  nowIso,
  randomToken,
  readJson,
  reply,
  sign,
  unsign,
} from "./util.js";

const DAY = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const INVITE_DAYS = 30;
const RESET_DAYS = 7;
const MARKS_LIMIT = 512 * 1024;

export const SESSION_PREFIX = "nxs_";

const later = (ms) => new Date(Date.now() + ms).toISOString().replace(/\.\d{3}Z$/, "Z");
const newId = (prefix) => `${prefix}_${randomToken(9)}`;

// --- validação ---------------------------------------------------------------------------------

function cleanEmail(value) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "email_invalido");
  return email;
}

function cleanName(value) {
  const name = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!name || name.length > 80) throw new HttpError(400, "nome_invalido");
  return name;
}

function cleanPassword(value) {
  const password = String(value ?? "");
  if (password.length < 8) throw new HttpError(400, "palavra_passe_curta");
  if (password.length > 200) throw new HttpError(400, "palavra_passe_longa");
  return password;
}

function cleanUntil(value) {
  if (value === null || value === undefined || value === "") return null;
  const time = Date.parse(String(value));
  if (!Number.isFinite(time)) throw new HttpError(400, "prazo_invalido");
  return new Date(time).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function cleanRole(value, allowNone = true) {
  const role = String(value ?? "");
  if (!isRank(role) || (!allowNone && role === "none")) throw new HttpError(400, "papel_invalido");
  return role;
}

// --- papéis e sessões --------------------------------------------------------------------------

/** O papel que vale agora: suspenso ou fora de prazo não tem acesso. */
export function effectiveRole(user, now = Date.now()) {
  if (!user || user.status !== "active") return "none";
  if (user.until && Date.parse(user.until) < now) return "none";
  return isRank(user.role) ? user.role : "none";
}

export const canRead = (user) => atLeast(effectiveRole(user), "viewer");
/** Grava alguma coisa no repositório (depositar, no mínimo); o resto decide-o `checkCommit`. */
export const canWrite = (user) => atLeast(effectiveRole(user), "contributor");

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    until: user.until ?? null,
    access: effectiveRole(user),
    google: Boolean(user.google_sub),
    password: Boolean(user.password),
    created_at: user.created_at,
    last_seen_at: user.last_seen_at ?? null,
  };
}

async function createSession(env, userId) {
  const token = `${SESSION_PREFIX}${randomToken(32)}`;
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(await digest(token), userId, nowIso(), later(SESSION_DAYS * DAY), nowIso())
    .run();
  return token;
}

/** A pessoa por trás de uma sessão (null se não existir ou tiver acabado). */
export async function sessionUser(env, token) {
  if (!env.DB || !token?.startsWith(SESSION_PREFIX)) return null;
  const hash = await digest(token);
  const row = await env.DB.prepare(
    `SELECT u.*, s.expires_at AS session_expires, s.last_seen_at AS session_seen
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
  )
    .bind(hash)
    .first();
  if (!row) return null;
  if (Date.parse(row.session_expires) < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  // A sessão prolonga-se com o uso (no máximo uma escrita por hora).
  if (!row.session_seen || Date.now() - Date.parse(row.session_seen) > 60 * 60 * 1000) {
    await env.DB.batch([
      env.DB.prepare("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?").bind(
        nowIso(),
        later(SESSION_DAYS * DAY),
        hash,
      ),
      env.DB.prepare("UPDATE users SET last_seen_at = ? WHERE id = ?").bind(nowIso(), row.id),
    ]);
  }
  return row;
}

async function requireUser(request, env) {
  const user = await sessionUser(env, bearer(request));
  if (!user) throw new HttpError(401, "sessao_invalida");
  return user;
}

/**
 * Quem gere as contas: o dono (com o token dele do GitHub) ou uma conta Gestor (com a sessão).
 * Devolve `{ login }` para o dono e `{ manager }` (a conta) para um Gestor.
 */
async function requireAdmin(request, env, fetchImpl) {
  const token = bearer(request);
  if (!token) throw new HttpError(401, "so_o_dono");
  if (token.startsWith(SESSION_PREFIX)) {
    const user = await sessionUser(env, token);
    if (!user) throw new HttpError(401, "sessao_invalida");
    if (effectiveRole(user) !== "manager") throw new HttpError(403, "so_o_dono");
    return { manager: user };
  }
  const login = await adminLogin(token, env, fetchImpl);
  if (!login) throw new HttpError(403, "so_o_dono");
  return { login };
}

/** O que um Gestor não faz: dar o nível Gestor e mexer nas contas de outros Gestores. */
function managerLimits(who, { role, target } = {}) {
  if (!who.manager) return;
  if (role === "manager") throw new HttpError(403, "so_o_dono");
  if (target && (target.role === "manager" || target.id === who.manager.id))
    throw new HttpError(403, "so_o_dono");
}

/** Limita tentativas (entrar, registar) por chave numa janela de tempo. */
async function throttle(env, key, max, windowMs) {
  const since = Date.now() - windowMs;
  await env.DB.prepare("DELETE FROM attempts WHERE key = ? AND at < ?").bind(key, since).run();
  const row = await env.DB.prepare("SELECT count(*) AS n FROM attempts WHERE key = ?")
    .bind(key)
    .first();
  if ((row?.n ?? 0) >= max) throw new HttpError(429, "demasiadas_tentativas");
  await env.DB.prepare("INSERT INTO attempts (key, at) VALUES (?, ?)").bind(key, Date.now()).run();
}

const clientIp = (request) => request.headers.get("CF-Connecting-IP") ?? "local";

let dummy = null;
/** Um resumo qualquer, para comparar quando o email não existe (o mesmo trabalho). */
async function dummyHash() {
  dummy ??= await hashPassword(randomToken(16));
  return dummy;
}

// --- convites ----------------------------------------------------------------------------------

async function findInvite(env, code) {
  if (!code) return null;
  const invite = await env.DB.prepare("SELECT * FROM invites WHERE code_hash = ?")
    .bind(await digest(String(code).trim()))
    .first();
  if (!invite || invite.used_by || Date.parse(invite.expires_at) < Date.now()) return null;
  return invite;
}

/** O convite dá o papel e o prazo a esta conta (e fica gasto). */
async function applyInvite(env, invite, userId) {
  const done = await env.DB.prepare(
    "UPDATE invites SET used_by = ?, used_at = ? WHERE id = ? AND used_by IS NULL",
  )
    .bind(userId, nowIso(), invite.id)
    .run();
  if (!done.meta?.changes) throw new HttpError(409, "convite_usado");
  await env.DB.prepare("UPDATE users SET role = ?, until = ?, status = 'active' WHERE id = ?")
    .bind(invite.role, invite.until ?? null, userId)
    .run();
}

const signupOpen = (env) => String(env.SIGNUP ?? "open") !== "invite";

async function createUser(env, { email, name, password = null, googleSub = null }) {
  const id = newId("u");
  try {
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, password, google_sub, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'none', 'active', ?)`,
    )
      .bind(id, email, name, password, googleSub, nowIso())
      .run();
  } catch (error) {
    if (/UNIQUE/i.test(String(error?.message))) throw new HttpError(409, "email_existe");
    throw error;
  }
  return id;
}

const userById = (env, id) => env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();

async function signedIn(env, userId) {
  const token = await createSession(env, userId);
  return { token, user: publicUser(await userById(env, userId)) };
}

// --- Google (OpenID Connect, fluxo com código) -------------------------------------------------

const googleReady = (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const stateSecret = (env) => env.SESSION_SECRET || env.GOOGLE_CLIENT_SECRET;

function returnUrl(env, value) {
  try {
    const url = new URL(String(value));
    if (list(env.ALLOWED_ORIGINS).includes(url.origin)) return `${url.origin}${url.pathname}`;
  } catch {
    // inválido: vai para o site
  }
  return env.APP_URL || "https://knowledge-nexus.github.io/";
}

async function googleStart(request, env) {
  if (!googleReady(env)) throw new HttpError(404, "google_desligado");
  const url = new URL(request.url);
  const state = await sign(stateSecret(env), {
    back: returnUrl(env, url.searchParams.get("volta")),
    invite: url.searchParams.get("convite") || null,
    exp: Date.now() + 10 * 60 * 1000,
  });
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/contas/google/volta`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  return Response.redirect(google.toString(), 302);
}

function decodeIdToken(idToken) {
  const payload = String(idToken ?? "").split(".")[1] ?? "";
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(json, (c) => c.charCodeAt(0))));
}

async function googleReturn(request, env, fetchImpl) {
  const url = new URL(request.url);
  const state = await unsign(stateSecret(env), url.searchParams.get("state"));
  const back = state?.back ?? returnUrl(env, null);
  const fail = (code) => Response.redirect(`${back}#/?entrar=erro&motivo=${code}`, 302);
  if (!state || state.exp < Date.now()) return fail("google_expirou");
  const code = url.searchParams.get("code");
  if (!code) return fail("google_cancelado");
  // O id_token vem directamente do Google (TLS), por isso basta confirmar os campos.
  const tokens = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/contas/google/volta`,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokens.ok) return fail("google_recusou");
  const claims = decodeIdToken((await tokens.json()).id_token);
  const issuers = ["accounts.google.com", "https://accounts.google.com"];
  if (
    claims.aud !== env.GOOGLE_CLIENT_ID ||
    !issuers.includes(claims.iss) ||
    claims.exp * 1000 < Date.now() ||
    !claims.sub ||
    claims.email_verified !== true
  )
    return fail("google_recusou");
  const email = cleanEmail(claims.email);
  const invite = await findInvite(env, state.invite);
  let user =
    (await env.DB.prepare("SELECT * FROM users WHERE google_sub = ?").bind(claims.sub).first()) ??
    (await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first());
  if (user && !user.google_sub) {
    // O mesmo email, confirmado pelo Google: liga a conta que já existia.
    await env.DB.prepare("UPDATE users SET google_sub = ? WHERE id = ?").bind(claims.sub, user.id).run();
  }
  if (!user) {
    if (!signupOpen(env) && !invite) return fail("registo_fechado");
    const name = String(claims.name || email.split("@")[0]).slice(0, 80);
    user = await userById(env, await createUser(env, { email, name, googleSub: claims.sub }));
  }
  if (invite) await applyInvite(env, invite, user.id);
  // A sessão chega à interface por um código de uso único (não fica no endereço).
  const token = await createSession(env, user.id);
  const handoff = randomToken(24);
  await env.DB.prepare(
    "INSERT INTO tickets (code_hash, kind, user_id, data, expires_at) VALUES (?, 'google', ?, ?, ?)",
  )
    .bind(await digest(handoff), user.id, token, later(2 * 60 * 1000))
    .run();
  return Response.redirect(`${back}#/?entrar=google&codigo=${handoff}`, 302);
}

async function takeTicket(env, kind, code) {
  const hash = await digest(String(code ?? ""));
  const ticket = await env.DB.prepare("SELECT * FROM tickets WHERE code_hash = ? AND kind = ?")
    .bind(hash, kind)
    .first();
  if (!ticket) return null;
  await env.DB.prepare("DELETE FROM tickets WHERE code_hash = ?").bind(hash).run();
  return Date.parse(ticket.expires_at) < Date.now() ? null : ticket;
}

// --- rotas -------------------------------------------------------------------------------------

async function route(request, env, fetchImpl, path) {
  const method = request.method;
  const ready = Boolean(env.DB) && githubConfigured(env);

  if (method === "GET" && path === "/config") {
    return {
      enabled: ready,
      google: ready && googleReady(env),
      signup: signupOpen(env),
      repo: dataRepo(env),
    };
  }
  if (!ready) throw new HttpError(503, "contas_por_configurar");

  if (method === "GET" && path === "/google") return googleStart(request, env);
  if (method === "GET" && path === "/google/volta") return googleReturn(request, env, fetchImpl);
  if (method === "POST" && path === "/google/troca") {
    const body = await readJson(request);
    const ticket = await takeTicket(env, "google", body.code);
    if (!ticket) throw new HttpError(400, "codigo_invalido");
    return { token: ticket.data, user: publicUser(await userById(env, ticket.user_id)) };
  }

  if (method === "POST" && path === "/registar") {
    const body = await readJson(request);
    const email = cleanEmail(body.email);
    const name = cleanName(body.name);
    const password = cleanPassword(body.password);
    await throttle(env, `registo:${clientIp(request)}`, 5, 60 * 60 * 1000);
    const invite = body.invite ? await findInvite(env, body.invite) : null;
    if (body.invite && !invite) throw new HttpError(400, "convite_invalido");
    if (!signupOpen(env) && !invite) throw new HttpError(403, "registo_fechado");
    const id = await createUser(env, { email, name, password: await hashPassword(password) });
    if (invite) await applyInvite(env, invite, id);
    return signedIn(env, id);
  }

  if (method === "POST" && path === "/entrar") {
    const body = await readJson(request);
    const email = cleanEmail(body.email);
    await throttle(env, `entrar:${email}`, 10, 15 * 60 * 1000);
    await throttle(env, `entrar-ip:${clientIp(request)}`, 30, 15 * 60 * 1000);
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    // Sem dizer se o email existe (nem pelo tempo que demora a responder).
    const stored = user?.password ?? (await dummyHash());
    const right = await checkPassword(String(body.password ?? ""), stored);
    if (!user?.password || !right) throw new HttpError(401, "credenciais_erradas");
    return signedIn(env, user.id);
  }

  if (method === "GET" && path.startsWith("/convite/")) {
    const invite = await findInvite(env, decodeURIComponent(path.slice("/convite/".length)));
    if (!invite) throw new HttpError(404, "convite_invalido");
    return { role: invite.role, label: invite.label, until: invite.until };
  }

  if (method === "POST" && path === "/repor") {
    const body = await readJson(request);
    const password = cleanPassword(body.password);
    const ticket = await takeTicket(env, "reset", body.code);
    if (!ticket) throw new HttpError(400, "codigo_invalido");
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(
        await hashPassword(password),
        ticket.user_id,
      ),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(ticket.user_id),
    ]);
    return signedIn(env, ticket.user_id);
  }

  if (path.startsWith("/admin/")) return admin(request, env, fetchImpl, path.slice(6));

  // Daqui para baixo: quem tem sessão.
  const user = await requireUser(request, env);

  if (method === "GET" && path === "/eu") {
    return {
      user: publicUser(user),
      repo: dataRepo(env),
      owner: canRead(user) ? await ownerLogin(env, fetchImpl) : null,
    };
  }
  if (method === "PATCH" && path === "/eu") {
    const body = await readJson(request);
    if (body.name !== undefined) {
      await env.DB.prepare("UPDATE users SET name = ? WHERE id = ?")
        .bind(cleanName(body.name), user.id)
        .run();
    }
    if (body.password !== undefined) {
      const password = cleanPassword(body.password);
      if (user.password && !(await checkPassword(String(body.current ?? ""), user.password)))
        throw new HttpError(403, "palavra_passe_errada");
      await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?")
        .bind(await hashPassword(password), user.id)
        .run();
    }
    return { user: publicUser(await userById(env, user.id)) };
  }
  if (method === "POST" && path === "/sair") {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await digest(bearer(request)))
      .run();
    return { ok: true };
  }
  if (method === "POST" && path === "/convite") {
    const body = await readJson(request);
    const invite = await findInvite(env, body.code);
    if (!invite) throw new HttpError(400, "convite_invalido");
    await applyInvite(env, invite, user.id);
    return { user: publicUser(await userById(env, user.id)) };
  }

  const marks = /^\/marcas\/([A-Za-z0-9._-]{1,100})$/.exec(path);
  if (marks) {
    if (!canRead(user)) throw new HttpError(403, "sem_acesso");
    const document = marks[1];
    if (method === "GET") {
      const row = await env.DB.prepare("SELECT body FROM marks WHERE user_id = ? AND document = ?")
        .bind(user.id, document)
        .first();
      if (!row) throw new HttpError(404, "sem_marcas");
      return new Response(row.body, { headers: { "Content-Type": "application/json" } });
    }
    if (method === "PUT") {
      const text = await request.text();
      if (text.length > MARKS_LIMIT) throw new HttpError(413, "pedido_grande");
      try {
        JSON.parse(text);
      } catch {
        throw new HttpError(400, "pedido_invalido");
      }
      await env.DB.prepare(
        `INSERT INTO marks (user_id, document, body, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, document) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
      )
        .bind(user.id, document, text, nowIso())
        .run();
      return { ok: true };
    }
  }
  throw new HttpError(404, "nao_encontrado");
}

/**
 * Gestão das contas e dos convites: o dono (com o token dele do GitHub) ou um Gestor (até ao
 * nível Editor). Os códigos de acesso só o dono: levam os tokens dele.
 */
async function admin(request, env, fetchImpl, path) {
  const who = await requireAdmin(request, env, fetchImpl);
  const method = request.method;
  if (path === "/codigos" || path.startsWith("/codigos/")) {
    if (who.manager) throw new HttpError(403, "so_o_dono");
    return handleCodes(request, env, path);
  }

  if (method === "GET" && path === "/contas") {
    const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    return { users: results.map(publicUser) };
  }
  const user = /^\/contas\/(u_[A-Za-z0-9_-]+)(\/repor)?$/.exec(path);
  if (user) {
    const target = await userById(env, user[1]);
    if (!target) throw new HttpError(404, "conta_nao_existe");
    managerLimits(who, { target });
    if (method === "POST" && user[2]) {
      const code = `KNR-${randomToken(15)}`;
      await env.DB.prepare(
        "INSERT INTO tickets (code_hash, kind, user_id, data, expires_at) VALUES (?, 'reset', ?, NULL, ?)",
      )
        .bind(await digest(code), target.id, later(RESET_DAYS * DAY))
        .run();
      return { code, expires_at: later(RESET_DAYS * DAY) };
    }
    if (method === "PATCH" && !user[2]) {
      const body = await readJson(request);
      const role = body.role !== undefined ? cleanRole(body.role) : target.role;
      managerLimits(who, { role });
      const status = body.status !== undefined ? String(body.status) : target.status;
      if (!["active", "paused"].includes(status)) throw new HttpError(400, "estado_invalido");
      const until = body.until !== undefined ? cleanUntil(body.until) : target.until;
      const name = body.name !== undefined ? cleanName(body.name) : target.name;
      await env.DB.prepare("UPDATE users SET role = ?, status = ?, until = ?, name = ? WHERE id = ?")
        .bind(role, status, until ?? null, name, target.id)
        .run();
      return { user: publicUser(await userById(env, target.id)) };
    }
    if (method === "DELETE" && !user[2]) {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(target.id),
        env.DB.prepare("DELETE FROM marks WHERE user_id = ?").bind(target.id),
        env.DB.prepare("DELETE FROM tickets WHERE user_id = ?").bind(target.id),
        env.DB.prepare("UPDATE invites SET used_by = 'removida' WHERE used_by = ?").bind(target.id),
        env.DB.prepare("DELETE FROM users WHERE id = ?").bind(target.id),
      ]);
      return { ok: true };
    }
  }

  if (method === "GET" && path === "/convites") {
    const { results } = await env.DB.prepare(
      `SELECT i.id, i.role, i.label, i.until, i.created_at, i.expires_at, i.used_at,
              i.used_by, u.name AS used_by_name, u.email AS used_by_email
       FROM invites i LEFT JOIN users u ON u.id = i.used_by ORDER BY i.created_at DESC`,
    ).all();
    return { invites: results };
  }
  if (method === "POST" && path === "/convites") {
    const body = await readJson(request);
    const role = cleanRole(body.role, false);
    managerLimits(who, { role });
    const label = body.label ? cleanName(body.label) : null;
    const until = cleanUntil(body.until);
    const code = `KNC-${randomToken(15)}`;
    const invite = {
      id: newId("i"),
      role,
      label,
      until,
      created_at: nowIso(),
      expires_at: later(INVITE_DAYS * DAY),
    };
    await env.DB.prepare(
      `INSERT INTO invites (id, code_hash, role, label, until, created_by, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        invite.id,
        await digest(code),
        role,
        label,
        until,
        who.login ?? who.manager.id,
        invite.created_at,
        invite.expires_at,
      )
      .run();
    return { invite, code };
  }
  const invite = /^\/convites\/(i_[A-Za-z0-9_-]+)$/.exec(path);
  if (invite && method === "DELETE") {
    if (who.manager) {
      const row = await env.DB.prepare("SELECT role FROM invites WHERE id = ?").bind(invite[1]).first();
      managerLimits(who, { role: row?.role });
    }
    await env.DB.prepare("DELETE FROM invites WHERE id = ?").bind(invite[1]).run();
    return { ok: true };
  }
  throw new HttpError(404, "nao_encontrado");
}

export async function handleAccounts(request, env, fetchImpl, path) {
  try {
    const result = await route(request, env, fetchImpl, path);
    return result instanceof Response
      ? withCors(request, env, result)
      : reply(request, env, 200, result);
  } catch (error) {
    if (error instanceof HttpError)
      return reply(request, env, error.status, { error: error.code, ...error.extra });
    return reply(request, env, 500, { error: "erro_interno", detail: String(error?.message ?? error) });
  }
}

function withCors(request, env, response) {
  // Os redireccionamentos (Google) não precisam de CORS; o resto leva-o.
  if (response.status >= 300 && response.status < 400) return response;
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors(request, env))) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}
