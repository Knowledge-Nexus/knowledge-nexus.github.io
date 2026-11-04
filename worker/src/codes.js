// Os códigos de acesso KN1-… que o dono deu, guardados para ele os ver em qualquer browser.
// Ficam cifrados (AES-GCM) na D1 e só passam pelas rotas do dono (`/contas/admin/codigos`).
// Nunca no repositório de dados: lá, quem só lê ficaria com tokens que escrevem.

import { dataRepo } from "./github.js";
import { base64url, fromBase64url, HttpError, nowIso, readJson } from "./util.js";

const encoder = new TextEncoder();
const MAX_CODES = 200;
const MAX_LENGTH = 4096;

let ready = false;
/** A tabela cria-se sozinha (também está em migrations/0002), para bastar publicar o Worker. */
async function ensureTable(env) {
  if (ready) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS access_codes (
       repo TEXT NOT NULL, id TEXT NOT NULL, code TEXT NOT NULL, updated_at TEXT NOT NULL,
       PRIMARY KEY (repo, id))`,
  ).run();
  ready = true;
}

/** A chave sai de um segredo do Worker (sem ele, os códigos guardados não se lêem). */
async function key(env) {
  const material = env.CODES_KEY || env.GITHUB_APP_PRIVATE_KEY || env.GITHUB_TOKEN;
  if (!material) throw new HttpError(503, "contas_por_configurar");
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(`nexus-codigos|${material}`));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function seal(env, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(env), encoder.encode(text));
  return `v1.${base64url(iv)}.${base64url(data)}`;
}

export async function unseal(env, sealed) {
  const [version, iv, data] = String(sealed).split(".");
  if (version !== "v1" || !iv || !data) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64url(iv) },
      await key(env),
      fromBase64url(data),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null; // a chave mudou (ex.: chave nova da GitHub App)
  }
}

function repoOf(env, value) {
  const repo = String(value ?? "");
  if (repo.toLowerCase() !== dataRepo(env).toLowerCase())
    throw new HttpError(400, "repositorio_nao_permitido");
  return dataRepo(env);
}

/** `/contas/admin/codigos…` (o dono já foi confirmado). */
export async function handleCodes(request, env, path) {
  await ensureTable(env);
  const url = new URL(request.url);
  const method = request.method;
  if (method === "GET" && path === "/codigos") {
    const repo = repoOf(env, url.searchParams.get("repo"));
    const { results } = await env.DB.prepare("SELECT id, code FROM access_codes WHERE repo = ?")
      .bind(repo)
      .all();
    const codes = {};
    let unreadable = 0;
    for (const row of results) {
      const code = await unseal(env, row.code);
      if (code) codes[row.id] = code;
      else unreadable++;
    }
    return { codes, unreadable };
  }
  if (method === "PUT" && path === "/codigos") {
    const body = await readJson(request, 512 * 1024);
    const repo = repoOf(env, body.repo);
    const entries = Object.entries(body.codes ?? {});
    if (entries.length > MAX_CODES) throw new HttpError(413, "pedido_grande");
    const statements = [];
    for (const [id, code] of entries) {
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new HttpError(400, "pedido_invalido");
      if (typeof code !== "string" || !code.startsWith("KN1-") || code.length > MAX_LENGTH)
        throw new HttpError(400, "pedido_invalido");
      statements.push(
        env.DB.prepare(
          `INSERT INTO access_codes (repo, id, code, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT (repo, id) DO UPDATE SET code = excluded.code, updated_at = excluded.updated_at`,
        ).bind(repo, id, await seal(env, code), nowIso()),
      );
    }
    if (statements.length) await env.DB.batch(statements);
    return { saved: statements.length };
  }
  const one = /^\/codigos\/([A-Za-z0-9_-]{1,80})$/.exec(path);
  if (one && method === "DELETE") {
    const repo = repoOf(env, url.searchParams.get("repo"));
    await env.DB.prepare("DELETE FROM access_codes WHERE repo = ? AND id = ?").bind(repo, one[1]).run();
    return { ok: true };
  }
  throw new HttpError(404, "nao_encontrado");
}
