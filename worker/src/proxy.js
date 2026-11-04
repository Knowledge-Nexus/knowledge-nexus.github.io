// Proxy da API do GitHub para quem entra com conta: a interface usa o mesmo cliente que com o
// token, mas com o endereço `/gh` do Worker e a sessão da conta. O Worker só deixa passar os
// pedidos de que a interface precisa, só para o repositório de dados, e conforme o papel:
// `reader` só lê; `editor` também escreve (commits com o nome de quem os fez).

import { canRead, canWrite, sessionUser } from "./accounts.js";
import { dataRepo, github, ownerLogin } from "./github.js";
import { bearer, cors, reply } from "./util.js";

// Os identificadores dos objectos (SHA-1 ou SHA-256 do git); só um segmento do caminho.
const SHA = "[0-9A-Za-z_-]+";
const READ = [
  /^\/contents\/.+$/,
  /^\/git\/ref\/heads\/[^/]+$/,
  new RegExp(`^/git/commits/${SHA}$`),
  new RegExp(`^/git/trees/${SHA}$`),
  /^\/actions\/runs$/,
];
const WRITE = [
  ["POST", /^\/git\/blobs$/],
  ["POST", /^\/git\/trees$/],
  ["POST", /^\/git\/commits$/],
  ["PATCH", /^\/git\/refs\/heads\/[^/]+$/],
  ["PUT", /^\/contents\/.+$/],
];
const PASS_HEADERS = [
  "content-type",
  "etag",
  "retry-after",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "last-modified",
];

/** Linha no fim de cada commit feito por uma conta (como «Feito por» dos códigos de acesso). */
export const accountTrailer = (user) => `Feito por: ${user.name} (conta ${user.email})`;

export async function handleProxy(request, env, fetchImpl, path) {
  const fail = (status, error) => reply(request, env, status, { message: error, error });
  const user = await sessionUser(env, bearer(request));
  if (!user) return fail(401, "sessao_invalida");
  if (!canRead(user)) return fail(403, "sem_acesso");

  const method = request.method;
  const repo = dataRepo(env);
  if (method === "GET" && path === "/user") {
    // Os documentos são do dono: a interface trabalha com o login dele.
    return reply(request, env, 200, { login: await ownerLogin(env, fetchImpl), name: user.name });
  }

  const prefix = `/repos/${repo}`;
  if (!path.toLowerCase().startsWith(prefix.toLowerCase())) return fail(403, "repositorio_nao_permitido");
  const rest = path.slice(prefix.length);
  const reading = method === "GET" && (rest === "" || READ.some((re) => re.test(rest)));
  const writing = WRITE.some(([m, re]) => m === method && re.test(rest));
  if (!reading && !writing) return fail(403, "pedido_nao_permitido");
  if (writing && !canWrite(user)) return fail(403, "so_leitura");

  let body;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
    // Os dois pedidos que criam commits levam o nome de quem os fez.
    if ((method === "POST" && rest === "/git/commits") || method === "PUT") {
      const commit = JSON.parse(body || "{}");
      commit.message = `${String(commit.message ?? "").trimEnd()}\n\n${accountTrailer(user)}`;
      body = JSON.stringify(commit);
    }
  }
  const url = new URL(request.url);
  const upstream = await github(env, fetchImpl, `${prefix}${rest}${url.search}`, {
    method,
    headers: {
      Accept: request.headers.get("Accept") ?? "application/vnd.github+json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body } : {}),
  });

  const headers = new Headers(cors(request, env));
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "no-store");
  if (method === "GET" && rest === "" && upstream.ok) {
    // As permissões são as da conta, não as da credencial do Worker.
    const info = await upstream.json();
    info.permissions = { pull: true, push: canWrite(user), admin: false };
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(info), { status: 200, headers });
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
