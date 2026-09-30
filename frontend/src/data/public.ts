// Fonte de dados só de leitura para o material público (modo de visitante).
// O motor publica-o num repositório público servido pelo GitHub Pages no mesmo domínio
// (ex.: https://knowledge-nexus.github.io/estudo-publico/), por isso não há token nem
// limites da API: são ficheiros estáticos.

import { getCached, putCached } from "./cache";
import type { WorkflowRun } from "./github/client";
import type { RepoRef } from "./github/commit";
import type { DataSource } from "./source";
import type { IndexManifest } from "./types";

/** Caminho do material público no mesmo domínio (configurável no build). */
export const PUBLIC_LIBRARY_PATH: string =
  (import.meta.env.VITE_PUBLIC_LIBRARY_PATH as string | undefined) ?? "/estudo-publico/";

const pad = (n: number) => String(n).padStart(4, "0");

export class PublicUnavailable extends Error {}

async function get(url: string): Promise<Response> {
  const res = await fetch(url, { cache: "no-cache" });
  if (res.status === 404) throw new PublicUnavailable(url);
  if (!res.ok) throw new Error(`${res.status} ao ler ${url}`);
  return res;
}

export async function fetchPublicManifest(
  base: string = PUBLIC_LIBRARY_PATH,
): Promise<IndexManifest | null> {
  try {
    const manifest = (await (await get(`${base}manifest.json`)).json()) as IndexManifest;
    return manifest.scope === "public" ? manifest : null;
  } catch (error) {
    if (error instanceof PublicUnavailable || error instanceof SyntaxError) return null;
    throw error;
  }
}

function readOnly(): never {
  throw new Error("material público: só leitura");
}

export class PublicDataSource implements DataSource {
  readonly repo: RepoRef;

  constructor(
    readonly login: string,
    readonly base: string = PUBLIC_LIBRARY_PATH,
  ) {
    this.repo = { owner: login, name: "publico", branch: "main" };
  }

  manifest(): Promise<IndexManifest | null> {
    return fetchPublicManifest(this.base);
  }

  async indexFile(name: string, sha256: string): Promise<Uint8Array> {
    const cached = await getCached(sha256);
    if (cached) return cached;
    const bytes = await this.binary(name);
    await putCached(sha256, bytes);
    return bytes;
  }

  async pageText(sha256: string, page: number): Promise<string> {
    return (await get(`${this.base}texto/${sha256}/paginas/${pad(page)}.md`)).text();
  }

  async binary(path: string): Promise<Uint8Array> {
    return new Uint8Array(await (await get(`${this.base}${path}`)).arrayBuffer());
  }

  upload = readOnly;
  patchDocument = readOnly;
  patchUser = readOnly;
  catalogRequest = readOnly;
  scaffold = readOnly;

  async runs(): Promise<WorkflowRun[]> {
    return [];
  }

  async structureReady(): Promise<boolean> {
    return true;
  }
}
