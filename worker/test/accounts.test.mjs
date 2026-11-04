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

const HEAD = "a".repeat(40);

/** GitHub simulado: o suficiente para o Worker (dono, nexus.yaml, acessos e o proxy). Cada
 * commit criado pelo proxy muda os ficheiros de `nextFiles` (o que a comparação devolve). */
function fakeGitHub() {
  const calls = [];
  const commits = new Map();
  const state = { nextFiles: [], counter: 0 };
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
    if (pathname === `/repos/${REPO}/git/commits` && init.method === "POST") {
      const body = JSON.parse(init.body);
      const id = String(++state.counter).padStart(40, "c");
      commits.set(id, { parents: body.parents.map((p) => ({ sha: p })), files: state.nextFiles });
      return json(201, { sha: id, message: body.message });
    }
    if (pathname === `/repos/${REPO}/git/ref/heads/main`) return json(200, { object: { sha: HEAD } });
    const commitGet = /\/git\/commits\/(\w+)$/.exec(pathname);
    if (commitGet && !init.method) {
      const commit = commits.get(commitGet[1]);
      return commit ? json(200, { parents: commit.parents }) : json(404, { message: "Not Found" });
    }
    const compare = /\/compare\/(\w+)\.\.\.(\w+)$/.exec(pathname);
    if (compare) {
      const commit = commits.get(compare[2]);
      return commit ? json(200, { files: commit.files }) : json(404, { message: "Not Found" });
    }
    if (pathname === `/repos/${REPO}/git/refs/heads/main` && init.method === "PATCH")
      return json(200, { ref: "refs/heads/main", body: JSON.parse(init.body) });
    if (pathname.startsWith(`/repos/${REPO}/contents/`) && init.method === "PUT")
      return json(201, { commit: { message: JSON.parse(init.body).message } });
    return json(200, { ok: true, path: pathname });
  };
  return { calls, fetchImpl, state };
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
  // Uma conta que não é Gestor também não (a sessão vale, o nível não chega).
  assert.equal((await call("GET", "/contas/admin/contas", { token: data.token })).status, 403);
  assert.equal((await call("GET", "/contas/admin/contas")).status, 401);
  const list = await call("GET", "/contas/admin/contas", { token: OWNER_TOKEN });
  assert.equal(list.status, 200);
  assert.equal(list.data.users[0].id, data.user.id);
});

test("Gestor: gere as contas até Editor, sem códigos nem outros Gestores", async () => {
  const boss = await signup("gestor@exemplo.pt");
  const other = await signup("ana@exemplo.pt");
  const peer = await signup("rui@exemplo.pt");
  const token = boss.data.token;
  // Antes de ser Gestor, a sessão não serve para gerir.
  assert.equal((await call("GET", "/contas/admin/contas", { token })).status, 403);
  await setRole(boss.data.user.id, { role: "manager" });
  await setRole(peer.data.user.id, { role: "manager" });

  const list = await call("GET", "/contas/admin/contas", { token });
  assert.equal(list.status, 200);
  assert.equal(list.data.users.length, 3);
  const patch = (id, body) => call("PATCH", `/contas/admin/contas/${id}`, { token, body });
  assert.equal((await patch(other.data.user.id, { role: "editor", until: null })).status, 200);
  assert.equal((await patch(other.data.user.id, { status: "paused" })).status, 200);
  // Dar o nível Gestor, ou mexer noutro Gestor (ou em si próprio), é só do dono.
  for (const res of [
    await patch(other.data.user.id, { role: "manager" }),
    await patch(peer.data.user.id, { role: "reader" }),
    await patch(boss.data.user.id, { role: "editor" }),
    await call("DELETE", `/contas/admin/contas/${peer.data.user.id}`, { token }),
    await call("POST", `/contas/admin/contas/${peer.data.user.id}/repor`, { token }),
  ]) {
    assert.equal(res.status, 403);
    assert.equal(res.data.error, "so_o_dono");
  }
  const listed = await call("GET", "/contas/admin/contas", { token: OWNER_TOKEN });
  assert.equal(listed.data.users.find((u) => u.id === peer.data.user.id).role, "manager");
  assert.equal(
    (await call("POST", `/contas/admin/contas/${other.data.user.id}/repor`, { token })).status,
    200,
  );

  // Convites até Editor; um convite de Gestor (do dono) não se apaga.
  const invite = await call("POST", "/contas/admin/convites", { token, body: { role: "editor" } });
  assert.equal(invite.status, 200);
  const high = await call("POST", "/contas/admin/convites", { token, body: { role: "manager" } });
  assert.equal(high.data.error, "so_o_dono");
  const owners = await call("POST", "/contas/admin/convites", {
    token: OWNER_TOKEN,
    body: { role: "manager" },
  });
  assert.equal(owners.status, 200);
  const del = (id) => call("DELETE", `/contas/admin/convites/${id}`, { token });
  assert.equal((await del(owners.data.invite.id)).data.error, "so_o_dono");
  assert.equal((await del(invite.data.invite.id)).status, 200);

  // Os códigos de acesso levam os tokens do dono: o Gestor não os vê.
  const codes = await call("GET", `/contas/admin/codigos?repo=${REPO}`, { token });
  assert.equal(codes.status, 403);
  assert.equal(codes.data.error, "so_o_dono");

  // Suspenso, deixa de gerir logo.
  await setRole(boss.data.user.id, { status: "paused" });
  assert.equal((await call("GET", "/contas/admin/contas", { token })).status, 403);
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
  gh.state.nextFiles = [{ filename: "documentos/a.yaml", status: "modified", patch: "+x: 1" }];
  const commit = await call("POST", `/gh/repos/${REPO}/git/commits`, {
    token,
    body: { message: "revisão: x", tree: "t".repeat(40), parents: [HEAD] },
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
    body: { sha: commit.data.sha, force: false },
  });
  assert.equal(ref.status, 200);
  // Para o GitHub só vai o sha (nunca `force`).
  assert.deepEqual(ref.data.body, { sha: commit.data.sha });
});

/** Um commit com estes ficheiros e o pedido para o ramo avançar até ele. */
async function push(token, files, { parents = [HEAD], branch = "main", force } = {}) {
  gh.state.nextFiles = files;
  const commit = await call("POST", `/gh/repos/${REPO}/git/commits`, {
    token,
    body: { message: "x", tree: "t".repeat(40), parents },
  });
  return call("PATCH", `/gh/repos/${REPO}/git/refs/heads/${branch}`, {
    token,
    body: { sha: commit.data.sha, ...(force ? { force } : {}) },
  });
}

const file = (filename, patch = "+a: 1") => ({ filename, status: "modified", patch });
const visibility = "@@ -1,3 +1,3 @@\n id: x\n-visibility: private\n+visibility: public";

test("cada nível só grava o que lhe cabe (o Worker verifica cada commit)", async () => {
  const { data } = await signup();
  const token = data.token;
  const expect = async (files, status, error, options) => {
    const res = await push(token, files, options);
    assert.equal(res.status, status, `${JSON.stringify(files)} → ${JSON.stringify(res.data)}`);
    if (error) assert.equal(res.data.error, error);
  };

  // Observador e Leitor não gravam nada.
  for (const role of ["viewer", "reader"]) {
    await setRole(data.user.id, { role });
    const blob = await call("POST", `/gh/repos/${REPO}/git/blobs`, { token, body: {} });
    assert.equal(blob.status, 403, role);
  }

  // Colaborador: só o depósito do dono.
  await setRole(data.user.id, { role: "contributor" });
  await expect([file("deposito/aluna/lote-1/exame.pdf")], 200);
  await expect([file("deposito/aluna/lote-1/a.pdf"), file("documentos/x.yaml")], 403, "fora_do_teu_nivel");
  await expect([file("deposito/outra/lote/a.pdf")], 403, "fora_do_teu_nivel");
  const put = await call("PUT", `/gh/repos/${REPO}/contents/catalogo/x.yaml`, {
    token,
    body: { message: "x", content: "" },
  });
  assert.equal(put.data.error, "fora_do_teu_nivel");

  // Organizador: arruma, mas não muda o que é público.
  await setRole(data.user.id, { role: "organizer" });
  await expect([file("documentos/x.yaml", "+removed:\n+  at: 2026-01-01")], 200);
  await expect([file("catalogo/_importar/pedido.yaml")], 200);
  await expect([file("documentos/x.yaml", visibility)], 403, "so_o_editor_publica");
  await expect([{ filename: "documentos/x.yaml", status: "modified" }], 403, "so_o_editor_publica");
  await expect([file("utilizadores/aluna.yaml")], 403, "fora_do_teu_nivel");
  await expect([file(`gerado/${"a".repeat(64)}/perguntas.yaml`)], 403, "fora_do_teu_nivel");

  // Editor: também o que é público; nunca o que é só do dono.
  await setRole(data.user.id, { role: "editor" });
  await expect([file("documentos/x.yaml", visibility), file("utilizadores/aluna.yaml")], 200);
  await expect([file(`gerado/${"a".repeat(64)}/perguntas.yaml`)], 200);
  for (const path of ["nexus.yaml", "acessos.yaml", ".github/workflows/x.yml", "originais/ab/c.pdf"])
    await expect([file(path)], 403, "fora_do_teu_nivel");
  await expect(
    [{ filename: "documentos/novo.yaml", previous_filename: "nexus.yaml", status: "renamed" }],
    403,
    "fora_do_teu_nivel",
  );

  // Gestor: no repositório, o mesmo que o Editor.
  await setRole(data.user.id, { role: "manager" });
  await expect([file("documentos/x.yaml", visibility), file("utilizadores/aluna.yaml")], 200);
  for (const path of ["nexus.yaml", "acessos.yaml", ".github/workflows/x.yml", "originais/ab/c.pdf"])
    await expect([file(path)], 403, "fora_do_teu_nivel");
  await setRole(data.user.id, { role: "editor" });

  // Só o ramo principal, sem forçar, logo a seguir ao commit actual.
  await expect([file("documentos/x.yaml")], 403, "pedido_nao_permitido", { force: true });
  await expect([file("documentos/x.yaml")], 403, "pedido_nao_permitido", { branch: "indices" });
  await expect([file("documentos/x.yaml")], 403, "commit_invalido", { parents: ["b".repeat(40)] });
  await expect([file("documentos/x.yaml")], 403, "commit_invalido", {
    parents: [HEAD, "b".repeat(40)],
  });
  await expect(Array.from({ length: 300 }, (_, i) => file(`documentos/${i}.yaml`)), 403, "demasiados_ficheiros");
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

test("códigos de acesso guardados: só o dono os lê, e ficam cifrados na base de dados", async () => {
  const code = "KN1-eyJyZXBvIjoieCJ9";
  const put = (token, body) => call("PUT", "/contas/admin/codigos", { token, body });
  // Só o dono: nem um token de código de acesso, nem uma conta.
  const { data } = await signup();
  assert.equal((await put(GUEST_TOKEN, { repo: REPO, codes: { a1: code } })).status, 403);
  assert.equal((await put(data.token, { repo: REPO, codes: { a1: code } })).status, 403);
  assert.equal((await put(OWNER_TOKEN, { repo: "outra/coisa", codes: { a1: code } })).status, 400);
  assert.equal((await put(OWNER_TOKEN, { repo: REPO, codes: { a1: "isto não" } })).status, 400);

  assert.deepEqual((await put(OWNER_TOKEN, { repo: REPO, codes: { a1: code, b2: `${code}2` } })).data, {
    saved: 2,
  });
  const read = await call("GET", `/contas/admin/codigos?repo=${encodeURIComponent(REPO)}`, {
    token: OWNER_TOKEN,
  });
  assert.deepEqual(read.data, { codes: { a1: code, b2: `${code}2` }, unreadable: 0 });
  // Na base de dados não aparece o código.
  const stored = env.DB.raw.prepare("SELECT code FROM access_codes WHERE id = 'a1'").get();
  assert.match(stored.code, /^v1\./);
  assert.ok(!stored.code.includes("KN1-"));

  // Com outra chave (ex.: chave nova da GitHub App) não se lê: conta como ilegível.
  env.GITHUB_TOKEN = "outro-segredo";
  const lost = await call("GET", `/contas/admin/codigos?repo=${encodeURIComponent(REPO)}`, {
    token: OWNER_TOKEN,
  });
  assert.deepEqual(lost.data, { codes: {}, unreadable: 2 });
  env.GITHUB_TOKEN = WORKER_TOKEN;

  await call("DELETE", `/contas/admin/codigos/b2?repo=${encodeURIComponent(REPO)}`, {
    token: OWNER_TOKEN,
  });
  const after = await call("GET", `/contas/admin/codigos?repo=${encodeURIComponent(REPO)}`, {
    token: OWNER_TOKEN,
  });
  assert.deepEqual(after.data.codes, { a1: code });
});
