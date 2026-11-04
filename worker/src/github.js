// Acesso do Worker ao GitHub em nome das contas: uma GitHub App instalada só no repositório
// de dados (recomendado: tokens de 1 hora, sem prazo a renovar) ou um token fine-grained
// guardado como segredo. As pessoas com conta nunca vêem esta credencial.

import { base64url, digest, list } from "./util.js";

const API = "https://api.github.com";
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "knowledge-nexus-worker",
  "X-GitHub-Api-Version": "2022-11-28",
};

export const dataRepo = (env) => list(env.DATA_REPOS)[0] ?? "";

// --- chave privada da App (o GitHub dá PKCS#1; o WebCrypto só importa PKCS#8) ----------------

function derLength(n) {
  if (n < 0x80) return [n];
  const bytes = [];
  for (let v = n; v > 0; v >>= 8) bytes.unshift(v & 0xff);
  return [0x80 | bytes.length, ...bytes];
}

const der = (tag, content) => [tag, ...derLength(content.length), ...content];

/** Envolve uma chave RSA PKCS#1 em PKCS#8 (PrivateKeyInfo). */
export function pkcs1ToPkcs8(pkcs1) {
  const version = [0x02, 0x01, 0x00];
  const rsaAlgorithm = [
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ];
  return new Uint8Array(der(0x30, [...version, ...rsaAlgorithm, ...der(0x04, [...pkcs1])]));
}

function pemBytes(pem) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

export async function importAppKey(pem) {
  const text = String(pem).replace(/\\n/g, "\n");
  const bytes = pemBytes(text);
  const pkcs8 = /BEGIN RSA PRIVATE KEY/.test(text) ? pkcs1ToPkcs8(bytes) : bytes;
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function appJwt(appId, key, now = Date.now()) {
  const seconds = Math.floor(now / 1000);
  const encode = (value) => base64url(new TextEncoder().encode(JSON.stringify(value)));
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iat: seconds - 60,
    exp: seconds + 9 * 60,
    iss: String(appId),
  })}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64url(signature)}`;
}

// --- token do Worker --------------------------------------------------------------------------

let installation = { token: null, until: 0 };

export function resetGitHubCache() {
  installation = { token: null, until: 0 };
  ownerCache = { value: null, until: 0 };
  adminCache.clear();
}

export const githubConfigured = (env) =>
  Boolean(env.GITHUB_TOKEN || (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY));

/** O token com que o Worker fala com o GitHub (null se não estiver configurado). */
export async function workerToken(env, fetchImpl) {
  if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN;
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) return null;
  if (installation.token && installation.until > Date.now()) return installation.token;
  const jwt = await appJwt(env.GITHUB_APP_ID, await importAppKey(env.GITHUB_APP_PRIVATE_KEY));
  const auth = { ...HEADERS, Authorization: `Bearer ${jwt}` };
  const repo = dataRepo(env);
  const found = await fetchImpl(`${API}/repos/${repo}/installation`, { headers: auth });
  if (!found.ok) throw new Error(`a GitHub App não está instalada em ${repo} (${found.status})`);
  const { id } = await found.json();
  const created = await fetchImpl(`${API}/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ repositories: [repo.split("/")[1]] }),
  });
  if (!created.ok) throw new Error(`o GitHub recusou o token da App (${created.status})`);
  const data = await created.json();
  // Renova 5 minutos antes de acabar (os tokens da App duram 1 hora).
  installation = { token: data.token, until: Date.parse(data.expires_at) - 5 * 60 * 1000 };
  return installation.token;
}

export async function github(env, fetchImpl, path, init = {}) {
  const token = await workerToken(env, fetchImpl);
  if (!token) throw new Error("falta a credencial do GitHub no Worker");
  return fetchImpl(`${API}${path}`, {
    ...init,
    headers: { ...HEADERS, ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
}

// --- dono do repositório de dados -------------------------------------------------------------

let ownerCache = { value: null, until: 0 };

/** O login do dono (`owner` do nexus.yaml): é a ele que pertencem os documentos. */
export async function ownerLogin(env, fetchImpl) {
  if (env.OWNER_LOGIN) return env.OWNER_LOGIN;
  if (ownerCache.value && ownerCache.until > Date.now()) return ownerCache.value;
  const response = await github(env, fetchImpl, `/repos/${dataRepo(env)}/contents/nexus.yaml`, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });
  if (!response.ok) throw new Error(`não consegui ler o nexus.yaml (${response.status})`);
  const owner = /^owner:\s*["']?([A-Za-z0-9-]+)/m.exec(await response.text())?.[1];
  if (!owner) throw new Error("o nexus.yaml não diz quem é o dono");
  ownerCache = { value: owner, until: Date.now() + 10 * 60 * 1000 };
  return owner;
}

// --- administrador: o dono, com o token dele do GitHub ----------------------------------------

const ADMIN_TTL_MS = 5 * 60 * 1000;
const adminCache = new Map();

/**
 * O token é do dono (ou de um login em ADMIN_LOGINS), escreve no repositório de dados privado
 * e NÃO é de um código de acesso temporário (esses usam o token do dono, mas estão no registo
 * `acessos.yaml` pelo SHA-256).
 */
export async function adminLogin(token, env, fetchImpl) {
  const fingerprint = await digest(token);
  const hit = adminCache.get(fingerprint);
  if (hit && hit.until > Date.now()) return hit.login;
  const auth = { headers: { ...HEADERS, Authorization: `Bearer ${token}` } };
  const repo = dataRepo(env);
  let login = null;
  const user = await fetchImpl(`${API}/user`, auth);
  if (user.ok) {
    const candidate = (await user.json()).login;
    const admins = list(env.ADMIN_LOGINS);
    const allowed = admins.length ? admins : [await ownerLogin(env, fetchImpl)];
    if (allowed.some((a) => a.toLowerCase() === String(candidate).toLowerCase())) {
      const info = await fetchImpl(`${API}/repos/${repo}`, auth);
      const data = info.ok ? await info.json() : null;
      if (data?.private === true && data.permissions?.push === true) {
        const registry = await fetchImpl(`${API}/repos/${repo}/contents/acessos.yaml`, {
          headers: { ...auth.headers, Accept: "application/vnd.github.raw+json" },
        });
        const text = registry.ok ? await registry.text() : "";
        // O token escreve mesmo (um blob vazio não muda nada): um token só de leitura do dono,
        // como os dos códigos «só ver», nunca gere contas.
        const probe = await fetchImpl(`${API}/repos/${repo}/git/blobs`, {
          method: "POST",
          headers: { ...auth.headers, "Content-Type": "application/json" },
          body: JSON.stringify({ content: "", encoding: "utf-8" }),
        });
        if (!text.includes(fingerprint) && probe.ok) login = candidate;
      }
    }
  }
  adminCache.set(fingerprint, { login, until: Date.now() + ADMIN_TTL_MS });
  return login;
}
