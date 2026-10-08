// Worker do Knowledge Nexus: acesso aos originais guardados no R2.
//
//   GET|HEAD /blob/<sha256>   descarrega (com Range)
//   PUT      /blob/<sha256>   envia (o R2 confirma o SHA-256 e o Worker aplica o limite de espaço)
//
// Autenticação: o token do GitHub do utilizador (Authorization: Bearer ...). O Worker pergunta
// ao GitHub se esse token tem acesso ao repositório de dados PRIVADO, por isso a fronteira de
// segurança continua a ser o repositório. O material público não passa por aqui: sai do
// repositório público (GitHub Pages).

const AUTH_TTL_MS = 5 * 60 * 1000;
const USAGE_TTL_MS = 30 * 1000;
const authCache = new Map();
let usageCache = { at: 0, bytes: 0 };

const list = (value) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function cors(request, env) {
  const origin = request.headers.get("Origin");
  const headers = { Vary: "Origin" };
  if (origin && list(env.ALLOWED_ORIGINS).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, HEAD, PUT, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Range, X-Nexus-Repo";
    headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Range, ETag";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function reply(request, env, status, body = null, extra = {}) {
  const headers = { ...cors(request, env), ...extra };
  if (body !== null && typeof body === "object" && !(body instanceof ReadableStream)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  return new Response(body, { status, headers });
}

async function digest(text) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
  const match = /^\/blob\/([0-9a-f]{64})$/.exec(new URL(request.url).pathname);
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
  if (!(await allowed(token, repo, write, fetchImpl)))
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
