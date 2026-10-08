import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { handle } from "../src/index.js";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function fakeBucket() {
  const objects = new Map();
  return {
    objects,
    async head(key) {
      const o = objects.get(key);
      return o ? { size: o.length, httpEtag: '"x"' } : null;
    },
    async get(key) {
      const o = objects.get(key);
      return o ? { body: new Blob([o]).stream(), size: o.length, httpEtag: '"x"' } : null;
    },
    async put(key, body, opts) {
      const data = Buffer.from(await new Response(body).arrayBuffer());
      if (sha(data) !== opts.sha256) throw new Error("checksum");
      objects.set(key, data);
    },
    async list() {
      return {
        objects: [...objects.values()].map((v) => ({ size: v.length })),
        truncated: false,
      };
    },
  };
}

const github =
  (isPrivate = true, push = true, pull = true) =>
  async () =>
    new Response(JSON.stringify({ private: isPrivate, permissions: { push, pull } }), {
      status: 200,
    });

const env = (bucket) => ({
  BUCKET: bucket,
  DATA_REPOS: "o/dados,o/outro",
  ALLOWED_ORIGINS: "https://app.test",
  MAX_BYTES: "100",
});

function req(method, path, { token = "tok", body, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    init.body = body;
    init.headers["Content-Length"] = String(body.length);
  }
  return new Request(`https://w.test${path}`, init);
}

test("sem token é 401, repositório público ou sem permissão é 403", async () => {
  const bucket = fakeBucket();
  const data = Buffer.from("ola");
  const path = `/blob/${sha(data)}`;
  assert.equal((await handle(req("GET", path, { token: null }), env(bucket), github())).status, 401);
  assert.equal((await handle(req("GET", path, { token: "a" }), env(bucket), github(false))).status, 403);
  const noPush = await handle(req("PUT", path, { token: "b", body: data }), env(bucket), github(true, false));
  assert.equal(noPush.status, 403);
});

test("PUT, HEAD e GET", async () => {
  const bucket = fakeBucket();
  const data = Buffer.from("conteudo de teste");
  const path = `/blob/${sha(data)}`;
  const put = await handle(req("PUT", path, { token: "c", body: data }), env(bucket), github());
  assert.equal(put.status, 201);
  assert.ok(bucket.objects.has(`blobs/${sha(data)}`));
  const again = await handle(req("PUT", path, { token: "c", body: data }), env(bucket), github());
  assert.equal(again.status, 200);
  assert.equal((await handle(req("HEAD", path, { token: "c" }), env(bucket), github())).status, 200);
  const get = await handle(req("GET", path, { token: "c" }), env(bucket), github());
  assert.equal(Buffer.from(await get.arrayBuffer()).toString(), "conteudo de teste");
});

test("SHA-256 errado é recusado", async () => {
  const bucket = fakeBucket();
  const wrong = req("PUT", `/blob/${"a".repeat(64)}`, { token: "d", body: Buffer.from("x") });
  assert.equal((await handle(wrong, env(bucket), github())).status, 400);
  assert.equal(bucket.objects.size, 0);
});

test("corte duro de espaço (507)", async () => {
  const bucket = fakeBucket();
  const a = Buffer.alloc(60, 1);
  const b = Buffer.alloc(60, 2);
  const first = await handle(req("PUT", `/blob/${sha(a)}`, { token: "e", body: a }), env(bucket), github());
  assert.equal(first.status, 201);
  const second = await handle(req("PUT", `/blob/${sha(b)}`, { token: "e", body: b }), env(bucket), github());
  assert.equal(second.status, 507);
  assert.equal(bucket.objects.size, 1);
});

test("segundo repositório tem prefixo próprio; desconhecido é recusado", async () => {
  const bucket = fakeBucket();
  const data = Buffer.from("zz");
  const path = `/blob/${sha(data)}`;
  const other = req("PUT", path, { token: "f", body: data, headers: { "X-Nexus-Repo": "o/outro" } });
  await handle(other, env(bucket), github());
  assert.ok(bucket.objects.has(`r/o/outro/blobs/${sha(data)}`));
  const unknown = req("GET", path, { token: "f", headers: { "X-Nexus-Repo": "x/y" } });
  assert.equal((await handle(unknown, env(bucket), github())).status, 403);
});

test("CORS só para origens permitidas", async () => {
  const path = "/blob/" + "a".repeat(64);
  const good = req("OPTIONS", path, { token: null, headers: { Origin: "https://app.test" } });
  assert.equal((await handle(good, env(fakeBucket()))).headers.get("Access-Control-Allow-Origin"), "https://app.test");
  const bad = req("OPTIONS", path, { token: null, headers: { Origin: "https://mau.test" } });
  assert.equal((await handle(bad, env(fakeBucket()))).headers.get("Access-Control-Allow-Origin"), null);
});
