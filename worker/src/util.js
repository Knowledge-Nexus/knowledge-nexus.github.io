// Peças comuns do Worker: respostas com CORS, aleatoriedade, resumos e comparações seguras.

export const list = (value) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function cors(request, env) {
  const origin = request.headers.get("Origin");
  const headers = { Vary: "Origin" };
  if (origin && list(env.ALLOWED_ORIGINS).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, HEAD, PUT, POST, PATCH, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] =
      "Authorization, Content-Type, Range, X-Nexus-Repo, Accept, X-GitHub-Api-Version";
    headers["Access-Control-Expose-Headers"] =
      "Content-Length, Content-Range, ETag, Retry-After, X-RateLimit-Remaining, X-RateLimit-Reset";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

export function reply(request, env, status, body = null, extra = {}) {
  const headers = { ...cors(request, env), ...extra };
  if (body !== null && typeof body === "object" && !(body instanceof ReadableStream)) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    body = JSON.stringify(body);
  }
  return new Response(status === 204 ? null : body, { status, headers });
}

export const bearer = (request) =>
  /^Bearer (.+)$/.exec(request.headers.get("Authorization") ?? "")?.[1] ?? null;

const encoder = new TextEncoder();

export const hex = (bytes) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function digest(text) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

export function base64url(bytes) {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64url(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export const randomToken = (bytes = 32) =>
  base64url(crypto.getRandomValues(new Uint8Array(bytes)));

/** Comparação em tempo constante (para resumos e assinaturas). */
export function sameText(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Palavras-passe: PBKDF2-SHA256 (o Worker aceita até 100 000 iterações).
const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return base64url(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${base64url(salt)}$${hash}`;
}

export async function checkPassword(password, stored) {
  const [kind, iterations, salt, hash] = String(stored ?? "").split("$");
  if (kind !== "pbkdf2" || !salt || !hash) return false;
  return sameText(await pbkdf2(password, fromBase64url(salt), Number(iterations)), hash);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Texto assinado (ex.: o `state` do Google): `<dados>.<assinatura>`. */
export async function sign(secret, data) {
  const payload = base64url(encoder.encode(JSON.stringify(data)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${base64url(signature)}`;
}

export async function unsign(secret, text) {
  const [payload, signature] = String(text ?? "").split(".");
  if (!payload || !signature) return null;
  const expected = base64url(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload)),
  );
  if (!sameText(signature, expected)) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64url(payload)));
  } catch {
    return null;
  }
}

export async function readJson(request, limit = 64 * 1024) {
  const text = await request.text();
  if (text.length > limit) throw new HttpError(413, "pedido_grande");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "pedido_invalido");
  }
}

/** Erro com código HTTP e código de mensagem (a interface traduz o código). */
export class HttpError extends Error {
  constructor(status, code, extra = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
