// Cliente mínimo da API REST do GitHub (só os pontos que a aplicação usa).
// O token nunca sai do browser: é enviado apenas para api.github.com (ver CSP).

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RepoInfo {
  full_name: string;
  private: boolean;
  default_branch: string;
  permissions?: { push?: boolean; admin?: boolean };
  size?: number;
}

export interface WorkflowRun {
  id: number;
  status: "queued" | "in_progress" | "completed" | "waiting" | "requested" | "pending";
  conclusion: string | null;
  head_sha: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  name?: string;
}

export interface TreeEntry {
  path: string;
  mode: "100644" | "100755";
  type: "blob";
  sha: string | null;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export class GitHubClient {
  tokenExpiration: string | null = null;

  constructor(
    private readonly token: string,
    private readonly fetchImpl: FetchLike = (input, init) => fetch(input, init),
    private readonly base = "https://api.github.com",
    private readonly maxAttempts = 5,
    private readonly baseDelayMs = 2000,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {}

  /**
   * Um pedido, com novas tentativas para falhas passageiras: rede ("Failed to fetch"),
   * limites de ritmo do GitHub (403/429 com "rate limit", que muitas vezes chegam ao browser
   * como erro de rede) e erros 5xx. Espera o que o GitHub pedir (Retry-After), ou cada vez
   * mais tempo.
   */
  private async send(method: string, path: string, body?: unknown, accept?: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      if (attempt > 0) await this.sleep(this.backoff(attempt, lastError));
      let response: Response;
      try {
        response = await this.fetchImpl(`${this.base}${path}`, {
          method,
          headers: {
            Accept: accept ?? "application/vnd.github+json",
            Authorization: `Bearer ${this.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          cache: "no-store",
        });
      } catch (error) {
        lastError = error; // falha de rede (ou resposta sem CORS): tenta outra vez
        continue;
      }
      const expiration = response.headers.get("github-authentication-token-expiration");
      if (expiration) this.tokenExpiration = expiration;
      if (response.ok) return response;
      let message = response.statusText;
      try {
        const data = (await response.json()) as { message?: string };
        message = data.message ?? message;
      } catch {
        // corpo sem JSON
      }
      const error = new GitHubError(response.status, message);
      const limited =
        response.status === 429 || (response.status === 403 && /rate limit/i.test(message));
      if (!limited && response.status < 500) throw error;
      const retryAfter = Number(response.headers.get("retry-after"));
      lastError = Object.assign(error, {
        retryAfterMs: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : null,
        limited,
      });
    }
    throw lastError;
  }

  private backoff(attempt: number, error: unknown): number {
    const info = error as { retryAfterMs?: number | null; limited?: boolean } | undefined;
    if (info?.retryAfterMs) return info.retryAfterMs;
    if (info?.limited) return 60_000; // limite secundário do GitHub: esperar um minuto
    return this.baseDelayMs * 2 ** (attempt - 1);
  }

  async json<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.send(method, path, body);
    return (await response.json()) as T;
  }

  user() {
    return this.json<{ login: string; name: string | null }>("GET", "/user");
  }

  repo(owner: string, name: string) {
    return this.json<RepoInfo>("GET", `/repos/${owner}/${name}`);
  }

  /** Conteúdo em bruto de um ficheiro (até 100 MB). */
  async raw(owner: string, name: string, path: string, ref: string): Promise<Uint8Array> {
    const response = await this.send(
      "GET",
      `/repos/${owner}/${name}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
      undefined,
      "application/vnd.github.raw+json",
    );
    return new Uint8Array(await response.arrayBuffer());
  }

  async rawText(owner: string, name: string, path: string, ref: string): Promise<string> {
    return new TextDecoder().decode(await this.raw(owner, name, path, ref));
  }

  async headSha(owner: string, name: string, branch: string): Promise<string> {
    const ref = await this.json<{ object: { sha: string } }>(
      "GET",
      `/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(branch)}`,
    );
    return ref.object.sha;
  }

  async commitTree(owner: string, name: string, sha: string): Promise<string> {
    const commit = await this.json<{ tree: { sha: string } }>(
      "GET",
      `/repos/${owner}/${name}/git/commits/${sha}`,
    );
    return commit.tree.sha;
  }

  async createBlob(owner: string, name: string, content: Uint8Array): Promise<string> {
    const blob = await this.json<{ sha: string }>("POST", `/repos/${owner}/${name}/git/blobs`, {
      content: toBase64(content),
      encoding: "base64",
    });
    return blob.sha;
  }

  async createTree(owner: string, name: string, baseTree: string, tree: TreeEntry[]) {
    const result = await this.json<{ sha: string }>("POST", `/repos/${owner}/${name}/git/trees`, {
      base_tree: baseTree,
      tree,
    });
    return result.sha;
  }

  async createCommit(owner: string, name: string, message: string, tree: string, parent: string) {
    const result = await this.json<{ sha: string }>("POST", `/repos/${owner}/${name}/git/commits`, {
      message,
      tree,
      parents: [parent],
    });
    return result.sha;
  }

  async updateRef(owner: string, name: string, branch: string, sha: string) {
    await this.json(
      "PATCH",
      `/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`,
      {
        sha,
        force: false,
      },
    );
  }

  /** Cria um ficheiro com a API de conteúdos (única forma de escrever num repo vazio). */
  async putFile(owner: string, name: string, path: string, content: Uint8Array, message: string) {
    await this.json("PUT", `/repos/${owner}/${name}/contents/${encodePath(path)}`, {
      message,
      content: toBase64(content),
    });
  }

  async runs(owner: string, name: string, perPage = 10): Promise<WorkflowRun[]> {
    const data = await this.json<{ workflow_runs: WorkflowRun[] }>(
      "GET",
      `/repos/${owner}/${name}/actions/runs?per_page=${perPage}`,
    );
    return data.workflow_runs;
  }
}
