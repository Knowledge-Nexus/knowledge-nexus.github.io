// Worker do Knowledge Nexus.
//
//   GET|HEAD /blob/<sha256>   descarrega um original do R2 (com Range)
//   PUT      /blob/<sha256>   envia (o R2 confirma o SHA-256 e o Worker aplica o limite de espaço)
//   /contas/…                 contas: registo, entrada, convites, gestão pelo dono (accounts.js)
//   /gh/…                     API do GitHub para quem entra com conta (proxy.js)
//
// Autenticação nos originais: o token do GitHub (o Worker pergunta ao GitHub se esse token tem
// acesso ao repositório de dados PRIVADO) ou a sessão de uma conta com acesso (`nxs_…`). O
// material público não passa por aqui: sai do repositório público (GitHub Pages).

import { canRead, canWrite, handleAccounts, SESSION_PREFIX, sessionUser } from "./accounts.js";
import { handleProxy } from "./proxy.js";
import { digest, list, reply } from "./util.js";

const AUTH_TTL_MS = 5 * 60 * 1000;
const USAGE_TTL_MS = 30 * 1000;
const authCache = new Map();
let usageCache = { at: 0, bytes: 0 };

// O repositório tem de ser privado e o token tem de ter a permissão pedida.
async function allowed(token, repo, write, fetchImpl) {
  const key = `${await digest(token)}|${repo}|${write ? "w" : "r"}`;
  const hit = authCache.get(key);
  if (hit && hit.until > Date.now()) return hit.ok;
  const res = await fetchImpl(`https://api.github.com/repos/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "knowledge-nexus-worker",
    },
  });
  let ok = false;
  if (res.ok) {
    const data = await res.json();
    ok = data.private === true && (write ? data.permissions?.push : data.permissions?.pull) === true;
  }
  authCache.set(key, { ok, until: Date.now() + AUTH_TTL_MS });
  return ok;
}

async function usedBytes(env) {
  if (Date.now() - usageCache.at < USAGE_TTL_MS) return usageCache.bytes;
  let total = 0;
  let cursor;
  do {
    const page = await env.BUCKET.list({ cursor });
    total += page.objects.reduce((sum, o) => sum + o.size, 0);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  usageCache = { at: Date.now(), bytes: total };
  return total;
}

// O 1.º repositório de DATA_REPOS usa `blobs/` (como o motor); os outros ficam em pastas próprias.
function keyFor(repos, repo, sha) {
  return repo === repos[0] ? `blobs/${sha}` : `r/${repo.toLowerCase()}/blobs/${sha}`;
}

export async function handle(request, env, fetchImpl = fetch) {
  if (request.method === "OPTIONS") return reply(request, env, 204);
  const pathname = new URL(request.url).pathname;
  try {
    if (pathname === "/contas" || pathname.startsWith("/contas/"))
      return await handleAccounts(request, env, fetchImpl, pathname.slice(7) || "/");
    if (pathname.startsWith("/gh/")) return await handleProxy(request, env, fetchImpl, pathname.slice(3));
    return await handleBlob(request, env, fetchImpl, pathname);
  } catch (error) {
    return reply(request, env, 502, { error: "erro_interno", message: String(error?.message ?? error) });
  }
}

async function handleBlob(request, env, fetchImpl, pathname) {
  const match = /^\/blob\/([0-9a-f]{64})$/.exec(pathname);
  if (!match) return reply(request, env, 404, { error: "não encontrado" });
  if (!["GET", "HEAD", "PUT"].includes(request.method))
    return reply(request, env, 405, { error: "método não suportado" });
  const sha = match[1];
  const write = request.method === "PUT";

  const repos = list(env.DATA_REPOS);
  const repo = request.headers.get("X-Nexus-Repo") || repos[0];
  if (!repos.includes(repo)) return reply(request, env, 403, { error: "repositório não permitido" });
  const token = /^Bearer (.+)$/.exec(request.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(request, env, 401, { error: "falta o token" });
  if (token.startsWith(SESSION_PREFIX)) {
    // Conta: só o repositório de dados das contas, e escrever só com o papel de editor.
    const user = await sessionUser(env, token);
    if (repo !== repos[0] || !(write ? canWrite(user) : canRead(user)))
      return reply(request, env, 403, { error: "sem acesso ao repositório de dados" });
  } else if (!(await allowed(token, repo, write, fetchImpl)))
    return reply(request, env, 403, { error: "sem acesso ao repositório de dados" });

  const key = keyFor(repos, repo, sha);

  if (!write) {
    if (request.method === "HEAD") {
      const head = await env.BUCKET.head(key);
      return head
        ? reply(request, env, 200, null, { "Content-Length": String(head.size), ETag: head.httpEtag })
        : reply(request, env, 404);
    }
    const object = await env.BUCKET.get(key, { range: request.headers });
    if (!object) return reply(request, env, 404, { error: "não encontrado" });
    const partial = request.headers.has("Range") && object.range;
    return reply(request, env, partial ? 206 : 200, object.body, {
      "Content-Type": "application/octet-stream",
      ETag: object.httpEtag,
      // Conteúdo endereçado por SHA-256: nunca muda.
      "Cache-Control": "private, max-age=31536000, immutable",
    });
  }

  if (await env.BUCKET.head(key)) return reply(request, env, 200, { stored: false, exists: true });
  const length = Number(request.headers.get("Content-Length"));
  if (!Number.isFinite(length) || length <= 0)
    return reply(request, env, 411, { error: "falta o Content-Length" });
  if (length > Number(env.MAX_UPLOAD_BYTES || 99_614_720))
    return reply(request, env, 413, { error: "ficheiro demasiado grande" });
  const maxBytes = Number(env.MAX_BYTES || 9_500_000_000);
  const used = await usedBytes(env);
  if (used + length > maxBytes)
    return reply(request, env, 507, { error: "limite de espaço atingido", used, max: maxBytes });
  try {
    await env.BUCKET.put(key, request.body, { sha256: sha });
  } catch {
    return reply(request, env, 400, { error: "o conteúdo não corresponde ao SHA-256" });
  }
  usageCache = { at: Date.now(), bytes: used + length };
  return reply(request, env, 201, { stored: true, exists: false });
}

export default { fetch: (request, env) => handle(request, env) };
