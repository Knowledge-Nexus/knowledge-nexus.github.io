// Gestão dos códigos de acesso temporário (ver `lib/invite.ts`).
//
// O registo `acessos.yaml` no repositório de dados diz, para cada código, se está activo,
// suspenso ou terminado e até quando. Cada código identifica-se pelo SHA-256 do token (nunca
// o token). A interface de quem entra com o código respeita o registo; o corte definitivo é
// apagar o token no GitHub, porque a API não deixa mudar o prazo de um token nem apagá-lo.
// Os códigos em si só ficam no browser do dono (localStorage), para os poder ver de novo.

import YAML from "yaml";
import { sha256Hex } from "./files";

export const ACCESS_FILE = "acessos.yaml";
/** Página dos tokens do dono no GitHub (para apagar um de vez). */
export const TOKENS_PAGE = "https://github.com/settings/personal-access-tokens";

export type AccessStatus = "active" | "paused" | "revoked";
/** Estado efectivo: o registado, ou terminado por ter passado o prazo (do acesso ou do token). */
export type AccessState = AccessStatus | "ended" | "token_expired";

export interface AccessEntry {
  id: string;
  name: string;
  token_sha256: string;
  /** Últimos caracteres do token, para o reconhecer na lista do GitHub. */
  token_hint: string;
  /** Fim do token no GitHub (não se pode prolongar; null se não tiver prazo). */
  token_expires: string | null;
  /** Fim do acesso decidido pelo dono (nunca depois do fim do token). */
  until: string | null;
  status: AccessStatus;
  created_at: string;
  updated_at?: string;
}

export function accessState(entry: AccessEntry, now = Date.now()): AccessState {
  if (entry.status === "revoked") return "revoked";
  if (entry.token_expires && Date.parse(entry.token_expires) <= now) return "token_expired";
  if (entry.status === "paused") return "paused";
  if (entry.until && Date.parse(entry.until) <= now) return "ended";
  return "active";
}

export async function tokenFingerprint(token: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(token.trim()));
}

export function newAccessId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function parseAccesses(text: string | null): AccessEntry[] {
  if (!text) return [];
  const data = YAML.parse(text) as { accesses?: AccessEntry[] } | null;
  return Array.isArray(data?.accesses) ? data.accesses : [];
}

export function stringifyAccesses(entries: AccessEntry[]): string {
  return [
    "# Acessos temporários (códigos KN1-…), geridos em Definições → «Acessos que deste».",
    "# Cada um identifica-se pelo SHA-256 do token; o token em si nunca fica aqui.",
    YAML.stringify({ accesses: entries }, { lineWidth: 100 }),
  ].join("\n");
}

/**
 * Novo fim do acesso, limitado ao fim do token. `capped`: pediu-se mais do que o token
 * permite (para ir além, renova-se com um token novo).
 */
export function clampUntil(
  wanted: Date,
  tokenExpires: string | null,
): { until: string; capped: boolean } {
  const limit = tokenExpires ? Date.parse(tokenExpires) : Number.POSITIVE_INFINITY;
  const capped = wanted.getTime() > limit;
  return { until: new Date(capped ? limit : wanted.getTime()).toISOString(), capped };
}

/** Os códigos guardados neste browser, por id do acesso. */
function codesKey(repo: string): string {
  return `nexus.codigos.${repo}`;
}

export function storedCodes(repo: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(codesKey(repo)) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function storeCode(repo: string, id: string, code: string | null): void {
  try {
    const codes = storedCodes(repo);
    if (code) codes[id] = code;
    else delete codes[id];
    localStorage.setItem(codesKey(repo), JSON.stringify(codes));
  } catch {
    // armazenamento indisponível: o código só se vê agora
  }
}
