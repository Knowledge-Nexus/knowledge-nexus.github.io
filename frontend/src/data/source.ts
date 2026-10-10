// Fonte de dados da interface. Fase 1: GitHubDataSource (repositório de dados privado).
// Fase 5: uma ApiDataSource com a mesma interface, sobre o backend próprio.

import { zipSync } from "fflate";
import YAML from "yaml";
import { sha256Hex } from "../lib/files";
import { guestTrailer } from "../lib/invite";
import { getCached, putCached } from "./cache";
import { type GitHubClient, GitHubError, type RepoInfo, type WorkflowRun } from "./github/client";
import { type Change, commitChanges, type RepoRef } from "./github/commit";
import type { CatalogBundle, IndexManifest } from "./types";

export const INDICES_BRANCH = "indices";
export const APP_REPOSITORY = { owner: "Knowledge-Nexus", name: "knowledge-nexus.github.io" };

/** Worker do Cloudflare R2 onde ficam os originais (vazio desactiva). */
export const STORAGE_URL: string =
  (import.meta.env.VITE_STORAGE_URL as string | undefined) ??
  "https://nexus-ficheiros.nightmareftw.workers.dev";
const ORIGINAL_PATH = /^originais\/[0-9a-f]{2}\/([0-9a-f]{64})(?:\.[^/]*)?$/;

/**
 * A API do GitHub recusa blobs grandes ("input too large"). Acima disto, o ficheiro vai em
 * partes (`<nome>.nexus-part-0001`…) com um manifesto `<nome>.nexus-parts.yaml`; o motor
 * junta-as e confirma o SHA-256 (nexus.pipeline.run._intake_parts).
 */
export const UPLOAD_PART_BYTES = 10 * 1024 * 1024;

export function splitUpload(path: string, entry: UploadEntry): Change[] {
  const bytes = entry.bytes!;
  if (bytes.length <= UPLOAD_PART_BYTES) return [{ path, content: bytes }];
  const count = Math.ceil(bytes.length / UPLOAD_PART_BYTES);
  const changes: Change[] = [];
  for (let i = 0; i < count; i++) {
    changes.push({
      path: `${path}.nexus-part-${String(i + 1).padStart(4, "0")}`,
      content: bytes.subarray(i * UPLOAD_PART_BYTES, (i + 1) * UPLOAD_PART_BYTES),
    });
  }
  changes.push({
    path: `${path}.nexus-parts.yaml`,
    content: YAML.stringify({
      path: entry.relativePath,
      size: bytes.length,
      sha256: entry.sha256,
      parts: count,
    }),
  });
  return changes;
}

/**
 * A API do GitHub limita os pedidos que criam conteúdo (cerca de 80 por minuto e 500 por
 * hora): centenas de ficheiros, um blob cada, esbarram nesse limite ("Failed to fetch").
 * A partir de `LOTE_MIN_FILES` ficheiros, o envio vai em lotes zip (`_lote-NNN.nexus-lote.zip`,
 * em partes se forem grandes); o motor abre-os como se os ficheiros tivessem vindo um a um
 * (nexus.pipeline.lotes).
 */
export const LOTE_MIN_FILES = 20;
export const LOTE_MAX_BYTES = 60 * 1024 * 1024;

const refYaml = (entry: UploadEntry) =>
  YAML.stringify({ sha256: entry.sha256, path: entry.relativePath });

export async function buildLotes(entries: UploadEntry[], base: string): Promise<Change[]> {
  const encoder = new TextEncoder();
  const changes: Change[] = [];
  let files: Record<string, [Uint8Array, { level: 0 }]> = {};
  let size = 0;
  let count = 0;
  const flush = async () => {
    if (Object.keys(files).length === 0) return;
    count += 1;
    // Sem compressão: PDFs, imagens e Office já vêm comprimidos, e é muito mais rápido.
    const zip = zipSync(files);
    const name = `_lote-${String(count).padStart(3, "0")}.nexus-lote.zip`;
    changes.push(
      ...splitUpload(`${base}/${name}`, {
        relativePath: name,
        sha256: await sha256Hex(zip),
        bytes: zip,
      }),
    );
    files = {};
    size = 0;
  };
  for (const entry of entries) {
    const name = entry.bytes ? entry.relativePath : `${entry.relativePath}.ref.yaml`;
    const data = entry.bytes ?? encoder.encode(refYaml(entry));
    if (size > 0 && size + data.length > LOTE_MAX_BYTES) await flush();
    files[name] = [data, { level: 0 }];
    size += data.length;
  }
  await flush();
  return changes;
}

export interface UploadEntry {
  relativePath: string;
  sha256: string;
  bytes?: Uint8Array; // ausente = conteúdo já existe no repositório (envia-se só referência)
}

export interface DataSource {
  readonly repo: RepoRef;
  readonly login: string;
  manifest(): Promise<IndexManifest | null>;
  indexFile(name: string, sha256: string): Promise<Uint8Array>;
  pageText(sha256: string, page: number): Promise<string>;
  binary(path: string): Promise<Uint8Array>;
  upload(
    entries: UploadEntry[],
    batch: string,
    onProgress?: (done: number, total: number) => void,
  ): Promise<string>;
  patchDocument(
    id: string,
    patch: (doc: Record<string, unknown>) => void,
    message: string,
  ): Promise<string>;
  /** Vários documentos num só commit (ex.: confirmar um grupo em "A rever"). */
  patchDocuments(
    patches: { id: string; patch: (doc: Record<string, unknown>) => void }[],
    message: string,
  ): Promise<string>;
  patchUser(update: (user: Record<string, unknown>) => void): Promise<string>;
  catalogRequest(bundle: CatalogBundle, message: string): Promise<string>;
  runs(): Promise<WorkflowRun[]>;
  structureReady(): Promise<boolean>;
  scaffold(): Promise<string>;
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

const pad = (n: number) => String(n).padStart(4, "0");

export function yamlUpdate(
  mutate: (data: Record<string, unknown>) => void,
  fallback?: () => Record<string, unknown>,
) {
  return (current: string | null): string | null => {
    const data = current
      ? (YAML.parse(current) as Record<string, unknown>)
      : fallback
        ? fallback()
        : null;
    if (!data) throw new Error("registo inexistente");
    mutate(data);
    return YAML.stringify(data, { lineWidth: 100 });
  };
}

export class GitHubDataSource implements DataSource {
  constructor(
    readonly client: GitHubClient,
    readonly repo: RepoRef,
    readonly login: string,
    readonly info?: RepoInfo,
    /** Quem entrou com um código de acesso temporário (vai nas mensagens dos commits). */
    readonly guest?: { name: string; until?: string },
  ) {}

  /** Um commit; com acesso temporário, a mensagem diz quem o fez. */
  private commit(
    changes: Change[],
    message: string,
    maxAttempts = 5,
    onProgress?: (done: number, total: number) => void,
  ): Promise<string> {
    const signed = this.guest ? `${message}\n\n${guestTrailer(this.guest.name)}` : message;
    return commitChanges(this.client, this.repo, changes, signed, maxAttempts, onProgress);
  }

  async manifest(): Promise<IndexManifest | null> {
    try {
      const text = await this.client.rawText(
        this.repo.owner,
        this.repo.name,
        "manifest.json",
        INDICES_BRANCH,
      );
      return JSON.parse(text) as IndexManifest;
    } catch (error) {
      if (error instanceof GitHubError && (error.status === 404 || error.status === 409))
        return null;
      throw error;
    }
  }

  async indexFile(name: string, sha256: string): Promise<Uint8Array> {
    const cached = await getCached(sha256);
    if (cached) return cached;
    const bytes = await this.client.raw(this.repo.owner, this.repo.name, name, INDICES_BRANCH);
    await putCached(sha256, bytes);
    return bytes;
  }

  async pageText(sha256: string, page: number): Promise<string> {
    return this.client.rawText(
      this.repo.owner,
      this.repo.name,
      `texto/${sha256}/paginas/${pad(page)}.md`,
      this.repo.branch,
    );
  }

  async binary(path: string): Promise<Uint8Array> {
    const sha = ORIGINAL_PATH.exec(path)?.[1];
    if (sha && STORAGE_URL) {
      try {
        const stored = await this.client.storedBlob(
          STORAGE_URL,
          this.repo.owner,
          this.repo.name,
          sha,
        );
        if (stored) return stored;
      } catch {
        // Worker indisponível: o original ainda pode estar no repositório.
      }
    }
    return this.client.raw(this.repo.owner, this.repo.name, path, this.repo.branch);
  }

  async upload(
    entries: UploadEntry[],
    batch: string,
    onProgress?: (done: number, total: number) => void,
  ): Promise<string> {
    const base = `deposito/${this.login}/${batch}`;
    if (entries.length >= LOTE_MIN_FILES) {
      const changes = await buildLotes(entries, base);
      return this.commit(
        changes,
        `depósito: ${entries.length} ficheiro(s) num lote (${batch})`,
        5,
        onProgress,
      );
    }
    const changes: Change[] = entries.flatMap((entry): Change[] =>
      entry.bytes
        ? splitUpload(`${base}/${entry.relativePath}`, entry)
        : [
            {
              path: `${base}/${entry.relativePath}.ref.yaml`,
              content: refYaml(entry),
            },
          ],
    );
    return this.commit(
      changes,
      `depósito: ${entries.length} ficheiro(s) (${batch})`,
      5,
      onProgress,
    );
  }

  patchDocument(
    id: string,
    patch: (doc: Record<string, unknown>) => void,
    message: string,
  ): Promise<string> {
    return this.commit([{ path: `documentos/${id}.yaml`, update: yamlUpdate(patch) }], message);
  }

  patchDocuments(
    patches: { id: string; patch: (doc: Record<string, unknown>) => void }[],
    message: string,
  ): Promise<string> {
    return this.commit(
      patches.map((p) => ({ path: `documentos/${p.id}.yaml`, update: yamlUpdate(p.patch) })),
      message,
    );
  }

  patchUser(update: (user: Record<string, unknown>) => void): Promise<string> {
    return this.commit(
      [
        {
          path: `utilizadores/${this.login}.yaml`,
          update: yamlUpdate(update, () => ({ login: this.login, created_at: nowIso() })),
        },
      ],
      `utilizador: preferências de ${this.login}`,
    );
  }

  catalogRequest(bundle: CatalogBundle, message: string): Promise<string> {
    const name = `${nowIso().replace(/[-:]/g, "")}-${Math.random().toString(36).slice(2, 6)}.yaml`;
    return this.commit(
      [{ path: `catalogo/_importar/${name}`, content: YAML.stringify(bundle) }],
      message,
    );
  }

  runs(): Promise<WorkflowRun[]> {
    return this.client.runs(this.repo.owner, this.repo.name, 5);
  }

  async structureReady(): Promise<boolean> {
    try {
      await this.client.rawText(this.repo.owner, this.repo.name, "nexus.yaml", this.repo.branch);
      return true;
    } catch (error) {
      if (error instanceof GitHubError && (error.status === 404 || error.status === 409))
        return false;
      throw error;
    }
  }

  /** Cria a estrutura do repositório de dados a partir do template público do motor. */
  async scaffold(): Promise<string> {
    const { owner, name } = APP_REPOSITORY;
    const templateRoot = "backend/nexus/scaffold/template/";
    const tree = await this.client.json<{ tree: { path: string; type: string }[] }>(
      "GET",
      `/repos/${owner}/${name}/git/trees/main?recursive=1`,
    );
    const renames: Record<string, string> = {
      gitignore: ".gitignore",
      gitattributes: ".gitattributes",
    };
    const changes: Change[] = [];
    for (const item of tree.tree) {
      if (item.type !== "blob" || !item.path.startsWith(templateRoot)) continue;
      const rel = item.path.slice(templateRoot.length);
      const text = await this.client.rawText(owner, name, item.path, "main");
      const rendered = text
        .replaceAll("__OWNER__", this.login)
        .replaceAll("__APP_REPOSITORY__", `${owner}/${name}`)
        .replaceAll("__APP_REF__", "main");
      changes.push({ path: renames[rel] ?? rel, content: rendered });
    }
    const vocab = await this.client.rawText(owner, name, "config/vocabularios.yaml", "main");
    changes.push({ path: "catalogo/vocabularios.yaml", content: vocab });
    changes.push({
      path: `utilizadores/${this.login}.yaml`,
      content: YAML.stringify({
        login: this.login,
        created_at: nowIso(),
        preferences: { tutor_mode: true },
      }),
    });
    try {
      await this.client.headSha(this.repo.owner, this.repo.name, this.repo.branch);
    } catch (error) {
      // Repositório vazio: a Git Data API só funciona depois do primeiro commit.
      if (!(error instanceof GitHubError) || (error.status !== 409 && error.status !== 404))
        throw error;
      const readme = changes.find((c) => c.path === "README.md");
      const content = readme && "content" in readme ? readme.content : "# Dados\n";
      await this.client.putFile(
        this.repo.owner,
        this.repo.name,
        "README.md",
        typeof content === "string"
          ? new TextEncoder().encode(content)
          : (content ?? new Uint8Array()),
        "estrutura inicial do repositório de dados",
      );
    }
    return this.commit(changes, "estrutura do repositório de dados (Knowledge Nexus)");
  }
}
