import assert from "node:assert/strict";
import { createHash, createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { beforeEach, test } from "node:test";

import { appJwt, importAppKey, resetGitHubCache, workerToken } from "../src/github.js";
import { handle } from "../src/index.js";
import { fakeD1 } from "./d1.mjs";

const REPO = "Knowledge-Nexus/estudo-dados";
const OWNER_TOKEN = "github_pat_dono";
const GUEST_TOKEN = "github_pat_codigo_kn1";
const WORKER_TOKEN = "github_pat_worker";
const READ_TOKEN = "github_pat_dono_so_leitura";
const ORIGIN = "https://knowledge-nexus.github.io";
const sha = (text) => createHash("sha256").update(text).digest("hex");

/** GitHub simulado: o suficiente para o Worker (dono, nexus.yaml, acessos e o proxy). */
function fakeGitHub() {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const { pathname, search } = new URL(url);
    const auth = new Headers(init.headers).get("Authorization") ?? "";
    calls.push({ method: init.method ?? "GET", path: pathname + search, auth, body: init.body });
    const json = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    const known = [OWNER_TOKEN, GUEST_TOKEN, WORKER_TOKEN, READ_TOKEN].map((t) => `Bearer ${t}`);
    if (!known.includes(auth)) return json(401, { message: "Bad credentials" });
    if (pathname === "/user") return json(200, { login: "aluna" });
    if (pathname === `/repos/${REPO}`)
      return json(200, { full_name: REPO, private: true, permissions: { push: true, admin: true } });
    if (pathname === `/repos/${REPO}/contents/nexus.yaml`)
      return new Response("format_version: 6\nowner: aluna\n");
    if (pathname === `/repos/${REPO}/contents/acessos.yaml`)
      return new Response(`- id: a1\n  token_sha256: ${sha(GUEST_TOKEN)}\n`);
    if (init.method && init.method !== "GET" && auth === `Bearer ${READ_TOKEN}`)
      return json(403, { message: "Resource not accessible by personal access token" });
    if (pathname === `/repos/${REPO}/git/commits` && init.method === "POST")
      return json(201, { sha: "c".repeat(40), message: JSON.parse(init.body).message });
    if (pathname.startsWith(`/repos/${REPO}/contents/`) && init.method === "PUT")
      return json(201, { commit: { message: JSON.parse(init.body).message } });
    return json(200, { ok: true, path: pathname });
  };
  return { calls, fetchImpl };
}

let gh;
let env;

beforeEach(() => {
  resetGitHubCache();
  gh = fakeGitHub();
  env = {
    DB: fakeD1(),
    DATA_REPOS: REPO,
    ALLOWED_ORIGINS: ORIGIN,
    GITHUB_TOKEN: WORKER_TOKEN,
    BUCKET: fakeBucket(),
  };
});

function fakeBucket() {
  const objects = new Map();
  return {
    objects,
    async head(key) {
      return objects.has(key) ? { size: objects.get(key).length, httpEtag: '"x"' } : null;
    },
    async get(key) {
      const o = objects.get(key);
      return o ? { body: new Blob([o]).stream(), size: o.length, httpEtag: '"x"' } : null;
    },
    async put(key, body) {
      objects.set(key, Buffer.from(await new Response(body).arrayBuffer()));
    },
    async list() {
      return { objects: [...objects.values()].map((v) => ({ size: v.length })), truncated: false };
    },
  };
}

async function call(method, path, { token, body, headers = {} } = {}) {
  const init = {
    method,
    headers: {
      Origin: ORIGIN,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  };
  const response = await handle(new Request(`https://w.example${path}`, init), env, gh.fetchImpl);
  const text = await response.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    // não é JSON
  }
  return { status: response.status, data, headers: response.headers };
}

const signup = (email = "rita@exemplo.pt", extra = {}) =>
  call("POST", "/contas/registar", {
    body: { email, name: "Rita", password: "segredo-longo", ...extra },
  });

async function setRole(id, patch) {
  const res = await call("PATCH", `/contas/admin/contas/${id}`, { token: OWNER_TOKEN, body: patch });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.user;
}

test("configuração: as contas só ligam com a base de dados e a credencial do GitHub", async () => {
  assert.deepEqual((await call("GET", "/contas/config")).data, {
    enabled: true,
    google: false,
    signup: true,
    repo: REPO,
  });
  delete env.DB;
  assert.equal((await call("GET", "/contas/config")).data.enabled, false);
  assert.equal((await signup()).status, 503);
});

test("registo e entrada: a conta nova fica à espera e não vê o repositório", async () => {
  const created = await signup("Rita@Exemplo.PT");
  assert.equal(created.status, 200);
  assert.match(created.data.token, /^nxs_/);
  assert.equal(created.data.user.email, "rita@exemplo.pt");
  assert.equal(created.data.user.access, "none");
  assert.equal(created.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.equal((await signup()).data.error, "email_existe");
  assert.equal((await signup("x@y.pt", { password: "curta" })).data.error, "palavra_passe_curta");

  const me = await call("GET", "/contas/eu", { token: created.data.token });
  assert.equal(me.data.user.name, "Rita");
  assert.equal(me.data.owner, null);
  const proxied = await call("GET", `/gh/repos/${REPO}`, { token: created.data.token });
  assert.equal(proxied.status, 403);
  assert.equal(proxied.data.error, "sem_acesso");

  const wrong = await call("POST", "/contas/entrar", {
    body: { email: "rita@exemplo.pt", password: "outra-coisa" },
  });
  assert.equal(wrong.status, 401);
  const right = await call("POST", "/contas/entrar", {
    body: { email: "RITA@exemplo.pt", password: "segredo-longo" },
  });
  assert.equal(right.status, 200);
  // Sair acaba com essa sessão.
  await call("POST", "/contas/sair", { token: right.data.token });
  assert.equal((await call("GET", "/contas/eu", { token: right.data.token })).status, 401);
});

test("muitas tentativas falhadas param a entrada durante um bocado", async () => {
  await signup();
  for (let i = 0; i < 10; i++) {
    await call("POST", "/contas/entrar", { body: { email: "rita@exemplo.pt", password: "x" } });
  }
  const blocked = await call("POST", "/contas/entrar", {
    body: { email: "rita@exemplo.pt", password: "segredo-longo" },
  });
  assert.equal(blocked.status, 429);
});

test("só o dono gere as contas: um token de código de acesso não serve", async () => {
  const { data } = await signup();
  assert.equal((await call("GET", "/contas/admin/contas", { token: GUEST_TOKEN })).status, 403);
  // Um token só de leitura do dono (ex.: de um código «só ver» antigo) também não.
  assert.equal((await call("GET", "/contas/admin/contas", { token: READ_TOKEN })).status, 403);
  assert.equal((await call("GET", "/contas/admin/contas", { token: data.token })).status, 401);
  assert.equal((await call("GET", "/contas/admin/contas")).status, 401);
  const list = await call("GET", "/contas/admin/contas", { token: OWNER_TOKEN });
  assert.equal(list.status, 200);
  assert.equal(list.data.users[0].id, data.user.id);
});

test("leitor lê pelo proxy e não escreve; editor escreve e o commit leva o nome", async () => {
  const { data } = await signup();
  const token = data.token;
  await setRole(data.user.id, { role: "reader" });

  assert.deepEqual((await call("GET", "/gh/user", { token })).data, { login: "aluna", name: "Rita" });
  const repo = await call("GET", `/gh/repos/${REPO}`, { token });
  assert.deepEqual(repo.data.permissions, { pull: true, push: false, admin: false });
  const file = await call("GET", `/gh/repos/${REPO}/contents/documentos/a.yaml?ref=main`, { token });
  assert.equal(file.status, 200);
  assert.equal(gh.calls.at(-1).auth, `Bearer ${WORKER_TOKEN}`);
  assert.equal(gh.calls.at(-1).path, `/repos/${REPO}/contents/documentos/a.yaml?ref=main`);
  const blob = await call("POST", `/gh/repos/${REPO}/git/blobs`, { token, body: { content: "" } });
  assert.equal(blob.status, 403);
  assert.equal(blob.data.message, "so_leitura");

  await setRole(data.user.id, { role: "editor" });
  assert.equal((await call("GET", `/gh/repos/${REPO}`, { token })).data.permissions.push, true);
  const commit = await call("POST", `/gh/repos/${REPO}/git/commits`, {
    token,
    body: { message: "revisão: x", tree: "t".repeat(40), parents: ["p".repeat(40)] },
  });
  assert.equal(commit.status, 201);
  assert.equal(commit.data.message, "revisão: x\n\nFeito por: Rita (conta rita@exemplo.pt)");
  const put = await call("PUT", `/gh/repos/${REPO}/contents/novo.txt`, {
    token,
    body: { message: "estrutura", content: "" },
  });
  assert.equal(put.data.commit.message, "estrutura\n\nFeito por: Rita (conta rita@exemplo.pt)");
  const ref = await call("PATCH", `/gh/repos/${REPO}/git/refs/heads/main`, {
    token,
    body: { sha: "c".repeat(40) },
  });
  assert.equal(ref.status, 200);
});

test("o proxy só deixa passar o repositório de dados e os pedidos da interface", async () => {
  const { data } = await signup();
  await setRole(data.user.id, { role: "editor" });
  const token = data.token;
  for (const [method, path] of [
    ["GET", "/gh/repos/Knowledge-Nexus/outro"],
    ["GET", `/gh/repos/${REPO}-copia/contents/x`],
    ["DELETE", `/gh/repos/${REPO}`],
    ["PATCH", `/gh/repos/${REPO}`],
    ["GET", `/gh/repos/${REPO}/collaborators`],
    ["PUT", `/gh/repos/${REPO}/collaborators/intruso`],
    ["GET", "/gh/user/repos"],
  ]) {
    const res = await call(method, path, { token, ...(method === "GET" ? {} : { body: {} }) });
    assert.equal(res.status, 403, `${method} ${path}`);
  }
});

test("suspenso ou fora de prazo perde o acesso logo", async () => {
  const { data } = await signup();
  const token = data.token;
  await setRole(data.user.id, { role: "reader" });
  assert.equal((await call("GET", `/gh/repos/${REPO}`, { token })).status, 200);
  await setRole(data.user.id, { status: "paused" });
  assert.equal((await call("GET", `/gh/repos/${REPO}`, { token })).status, 403);
  await setRole(data.user.id, { status: "active", until: "2020-01-01T00:00:00Z" });
  const me = await call("GET", "/contas/eu", { token });
  assert.equal(me.data.user.access, "none");
  assert.equal((await call("GET", `/gh/repos/${REPO}`, { token })).status, 403);
  await setRole(data.user.id, { until: null });
  assert.equal((await call("GET", `/gh/repos/${REPO}`, { token })).status, 200);
});

test("convites: dão o papel e o prazo a quem se regista, uma só vez", async () => {
  const created = await call("POST", "/contas/admin/convites", {
    token: OWNER_TOKEN,
    body: { role: "reader", label: "Turma de AM", until: "2030-01-01" },
  });
  assert.equal(created.status, 200);
  const code = created.data.code;
  assert.match(code, /^KNC-/);
  assert.deepEqual((await call("GET", `/contas/convite/${code}`)).data, {
    role: "reader",
    label: "Turma de AM",
    until: "2030-01-01T00:00:00Z",
  });
  const joined = await signup("joao@exemplo.pt", { invite: code });
  assert.equal(joined.data.user.access, "reader");
  assert.equal(joined.data.user.until, "2030-01-01T00:00:00Z");
  assert.equal((await signup("ana@exemplo.pt", { invite: code })).data.error, "convite_invalido");
  const invites = await call("GET", "/contas/admin/convites", { token: OWNER_TOKEN });
  assert.equal(invites.data.invites[0].used_by_email, "joao@exemplo.pt");

  // Quem já tem conta aceita um convite depois de entrar.
  const other = await call("POST", "/contas/admin/convites", {
    token: OWNER_TOKEN,
    body: { role: "editor" },
  });
  const { data } = await signup("ana@exemplo.pt");
  const accepted = await call("POST", "/contas/convite", {
    token: data.token,
    body: { code: other.data.code },
  });
  assert.equal(accepted.data.user.access, "editor");
});

test("só por convite: sem convite não há registo", async () => {
  env.SIGNUP = "invite";
  assert.equal((await signup()).data.error, "registo_fechado");
  assert.equal((await call("GET", "/contas/config")).data.signup, false);
});

test("repor a palavra-passe com o código dado pelo dono", async () => {
  const { data } = await signup();
  const reset = await call("POST", `/contas/admin/contas/${data.user.id}/repor`, {
    token: OWNER_TOKEN,
  });
  assert.match(reset.data.code, /^KNR-/);
  const done = await call("POST", "/contas/repor", {
    body: { code: reset.data.code, password: "nova-palavra-passe" },
  });
  assert.equal(done.status, 200);
  // As sessões antigas acabam; o código não volta a servir.
  assert.equal((await call("GET", "/contas/eu", { token: data.token })).status, 401);
  const again = await call("POST", "/contas/repor", {
    body: { code: reset.data.code, password: "outra-palavra-passe" },
  });
  assert.equal(again.status, 400);
  const login = await call("POST", "/contas/entrar", {
    body: { email: "rita@exemplo.pt", password: "nova-palavra-passe" },
  });
  assert.equal(login.status, 200);
});

test("o dono muda o nome e remove uma conta", async () => {
  const { data } = await signup();
  assert.equal((await setRole(data.user.id, { name: "Rita Silva" })).name, "Rita Silva");
  const removed = await call("DELETE", `/contas/admin/contas/${data.user.id}`, {
    token: OWNER_TOKEN,
  });
  assert.equal(removed.status, 200);
  assert.equal((await call("GET", "/contas/eu", { token: data.token })).status, 401);
});

test("marcas de leitura de cada conta", async () => {
  const { data } = await signup();
  const token = data.token;
  assert.equal((await call("PUT", "/contas/marcas/doc-1", { token, body: "{}" })).status, 403);
  await setRole(data.user.id, { role: "reader" });
  assert.equal((await call("GET", "/contas/marcas/doc-1", { token })).status, 404);
  const file = { format: "nexus-anotacoes", document: "doc-1", pages: { 1: [] } };
  assert.equal((await call("PUT", "/contas/marcas/doc-1", { token, body: file })).status, 200);
  assert.deepEqual((await call("GET", "/contas/marcas/doc-1", { token })).data, file);
  assert.equal((await call("PUT", "/contas/marcas/doc-1", { token, body: "{x" })).status, 400);
});

test("originais no R2 com a sessão: o leitor descarrega, só o editor envia", async () => {
  const { data } = await signup();
  const token = data.token;
  const hash = "a".repeat(64);
  env.BUCKET.objects.set(`blobs/${hash}`, Buffer.from("pdf"));
  assert.equal((await call("GET", `/blob/${hash}`, { token })).status, 403);
  await setRole(data.user.id, { role: "reader" });
  const got = await call("GET", `/blob/${hash}`, { token });
  assert.equal(got.status, 200);
  assert.equal(got.data, "pdf");
  const put = await call("PUT", `/blob/${"b".repeat(64)}`, {
    token,
    body: "x",
    headers: { "Content-Length": "1" },
  });
  assert.equal(put.status, 403);
});

test("Google: volta com o código, cria a conta e entrega a sessão por um código único", async () => {
  env.GOOGLE_CLIENT_ID = "cliente.apps.googleusercontent.com";
  env.GOOGLE_CLIENT_SECRET = "segredo-google";
  assert.equal((await call("GET", "/contas/config")).data.google, true);
  const start = await handle(
    new Request(`https://w.example/contas/google?volta=${encodeURIComponent(`${ORIGIN}/`)}`),
    env,
    gh.fetchImpl,
  );
  assert.equal(start.status, 302);
  const google = new URL(start.headers.get("Location"));
  assert.equal(google.searchParams.get("client_id"), env.GOOGLE_CLIENT_ID);
  assert.equal(google.searchParams.get("redirect_uri"), "https://w.example/contas/google/volta");
  const state = google.searchParams.get("state");

  const payload = Buffer.from(
    JSON.stringify({
      iss: "https://accounts.google.com",
      aud: env.GOOGLE_CLIENT_ID,
      sub: "g-123",
      email: "Marta@gmail.com",
      email_verified: true,
      name: "Marta",
      exp: Math.floor(Date.now() / 1000) + 600,
    }),
  ).toString("base64url");
  const fetchImpl = async (url, init) => {
    if (String(url) === "https://oauth2.googleapis.com/token") {
      assert.match(String(init.body), /client_secret=segredo-google/);
      return new Response(JSON.stringify({ id_token: `h.${payload}.s` }));
    }
    return gh.fetchImpl(url, init);
  };
  const back = await handle(
    new Request(`https://w.example/contas/google/volta?code=abc&state=${encodeURIComponent(state)}`),
    env,
    fetchImpl,
  );
  assert.equal(back.status, 302);
  const location = back.headers.get("Location");
  assert.ok(location.startsWith(`${ORIGIN}/#/?entrar=google&codigo=`), location);
  const code = location.split("codigo=")[1];
  const exchanged = await call("POST", "/contas/google/troca", { body: { code } });
  assert.equal(exchanged.data.user.email, "marta@gmail.com");
  assert.equal(exchanged.data.user.google, true);
  assert.equal((await call("GET", "/contas/eu", { token: exchanged.data.token })).status, 200);
  assert.equal((await call("POST", "/contas/google/troca", { body: { code } })).status, 400);

  // Um state adulterado não passa.
  const forged = await handle(
    new Request(`https://w.example/contas/google/volta?code=abc&state=${state}x`),
    env,
    fetchImpl,
  );
  assert.match(forged.headers.get("Location"), /motivo=google_expirou/);
});

test("GitHub App: a chave PKCS#1 do GitHub assina o JWT e o token da instalação fica em cache", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const jwt = await appJwt("123", await importAppKey(privateKey));
  const [head, body, signature] = jwt.split(".");
  assert.ok(
    verify(
      "RSA-SHA256",
      Buffer.from(`${head}.${body}`),
      createPublicKey(publicKey),
      Buffer.from(signature, "base64url"),
    ),
  );
  assert.equal(JSON.parse(Buffer.from(body, "base64url")).iss, "123");

  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push(`${init.method ?? "GET"} ${new URL(url).pathname}`);
    if (url.endsWith("/installation")) return new Response(JSON.stringify({ id: 77 }));
    return new Response(
      JSON.stringify({
        token: "ghs_instalacao",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      }),
      { status: 201 },
    );
  };
  const appEnv = {
    DATA_REPOS: REPO,
    GITHUB_APP_ID: "123",
    // Como fica quando se cola a chave numa linha (\n escritos).
    GITHUB_APP_PRIVATE_KEY: privateKey.replace(/\n/g, "\\n"),
  };
  assert.equal(await workerToken(appEnv, fetchImpl), "ghs_instalacao");
  assert.equal(await workerToken(appEnv, fetchImpl), "ghs_instalacao");
  assert.deepEqual(calls, [
    `GET /repos/${REPO}/installation`,
    "POST /app/installations/77/access_tokens",
  ]);
});
