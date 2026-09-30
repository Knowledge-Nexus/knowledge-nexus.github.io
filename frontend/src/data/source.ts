// Fonte de dados da interface. Fase 1: GitHubDataSource (repositório de dados privado).
// Fase 5: uma ApiDataSource com a mesma interface, sobre o backend próprio.

import YAML from "yaml";
import { getCached, putCached } from "./cache";
import { type GitHubClient, GitHubError, type RepoInfo, type WorkflowRun } from "./github/client";
import { type Change, commitChanges, type RepoRef } from "./github/commit";
import type { CatalogBundle, IndexManifest } from "./types";

export const INDICES_BRANCH = "indices";
export const APP_REPOSITORY = { owner: "Knowledge-Nexus", name: "knowledge-nexus.github.io" };

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
  upload(entries: UploadEntry[], batch: string): Promise<string>;
  patchDocument(
    id: string,
    patch: (doc: Record<string, unknown>) => void,
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
  ) {}

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

  binary(path: string): Promise<Uint8Array> {
    return this.client.raw(this.repo.owner, this.repo.name, path, this.repo.branch);
  }

  upload(entries: UploadEntry[], batch: string): Promise<string> {
    const base = `deposito/${this.login}/${batch}`;
    const changes: Change[] = entries.map((entry) =>
      entry.bytes
        ? { path: `${base}/${entry.relativePath}`, content: entry.bytes }
        : {
            path: `${base}/${entry.relativePath}.ref.yaml`,
            content: YAML.stringify({ sha256: entry.sha256, path: entry.relativePath }),
          },
    );
    return commitChanges(
      this.client,
      this.repo,
      changes,
      `depósito: ${entries.length} ficheiro(s) (${batch})`,
    );
  }

  patchDocument(
    id: string,
    patch: (doc: Record<string, unknown>) => void,
    message: string,
  ): Promise<string> {
    return commitChanges(
      this.client,
      this.repo,
      [{ path: `documentos/${id}.yaml`, update: yamlUpdate(patch) }],
      message,
    );
  }

  patchUser(update: (user: Record<string, unknown>) => void): Promise<string> {
    return commitChanges(
      this.client,
      this.repo,
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
    return commitChanges(
      this.client,
      this.repo,
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
    return commitChanges(
      this.client,
      this.repo,
      changes,
      "estrutura do repositório de dados (Knowledge Nexus)",
    );
  }
}
