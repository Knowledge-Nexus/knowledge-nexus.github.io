// GitHub falso em memória, para testes (Vitest) e E2E (Playwright). Implementa apenas os
// pontos da API usados pela aplicação, com a semântica relevante (fast-forward, 404, 422).

export interface FakeRepo {
  private: boolean;
  branches: Record<string, Record<string, Uint8Array>>; // ramo → caminho → conteúdo
  commits: { sha: string; branch: string; message: string; paths: string[] }[];
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64decode(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export class FakeGitHub {
  repos = new Map<string, FakeRepo>();
  login = "aluna";
  token = "token-de-teste";
  /** Chamado antes de cada updateRef: permite simular pushes concorrentes. */
  beforeUpdateRef?: (repo: FakeRepo) => void;
  private blobs = new Map<string, Uint8Array>();
  private trees = new Map<
    string,
    { base: string | null; entries: { path: string; sha: string | null; type?: string }[] }
  >();
  /** Árvores existentes vistas pela API (GET /git/trees/:sha): ficheiros sob um prefixo. */
  private views = new Map<string, { files: Record<string, Uint8Array>; prefix: string }>();
  private commitTrees = new Map<
    string,
    { tree: string; parent: string | null; snapshot?: Record<string, Uint8Array> }
  >();
  private heads = new Map<string, string>(); // "owner/name#branch" → commit sha
  private counter = 0;

  addRepo(
    fullName: string,
    files: Record<string, string | Uint8Array>,
    options: { private?: boolean; indices?: Record<string, Uint8Array | string> } = {},
  ) {
    const main: Record<string, Uint8Array> = {};
    for (const [path, content] of Object.entries(files)) {
      main[path] = typeof content === "string" ? encoder.encode(content) : content;
    }
    const repo: FakeRepo = { private: options.private ?? true, branches: { main }, commits: [] };
    if (options.indices) {
      repo.branches.indices = Object.fromEntries(
        Object.entries(options.indices).map(([p, c]) => [
          p,
          typeof c === "string" ? encoder.encode(c) : c,
        ]),
      );
    }
    this.repos.set(fullName, repo);
    for (const branch of Object.keys(repo.branches)) this.snapshotHead(fullName, branch);
    return repo;
  }

  text(fullName: string, path: string, branch = "main"): string | undefined {
    const bytes = this.repos.get(fullName)?.branches[branch]?.[path];
    return bytes ? decoder.decode(bytes) : undefined;
  }

  private sha(prefix: string) {
    this.counter += 1;
    return `${prefix}${this.counter.toString(16).padStart(39, "0")}`.slice(0, 40);
  }

  private snapshotHead(fullName: string, branch: string) {
    const files = this.repos.get(fullName)!.branches[branch]!;
    const sha = this.sha("c");
    const tree = this.sha("t");
    this.trees.set(tree, { base: null, entries: [] });
    this.commitTrees.set(sha, { tree, parent: null, snapshot: { ...files } });
    this.views.set(tree, { files: { ...files }, prefix: "" });
    this.heads.set(`${fullName}#${branch}`, sha);
    return sha;
  }

  /** Simula um push de outra origem (ex.: o pipeline) que faz o ramo avançar. */
  externalPush(fullName: string, files: Record<string, string>, branch = "main") {
    const repo = this.repos.get(fullName)!;
    for (const [path, content] of Object.entries(files))
      repo.branches[branch]![path] = encoder.encode(content);
    const sha = this.snapshotHead(fullName, branch);
    repo.commits.push({ sha, branch, message: "externo", paths: Object.keys(files) });
  }

  /** Entradas de uma árvore criada pela API, com caminhos completos (as subárvores novas
   * expandem-se; as que vêm de `views` não mudaram). */
  private flatten(sha: string, prefix = ""): { path: string; sha: string | null }[] {
    const out: { path: string; sha: string | null }[] = [];
    for (const entry of this.trees.get(sha)?.entries ?? []) {
      if (entry.type === "tree") {
        if (entry.sha && this.trees.has(entry.sha) && !this.views.has(entry.sha))
          out.push(...this.flatten(entry.sha, `${prefix}${entry.path}/`));
      } else out.push({ path: `${prefix}${entry.path}`, sha: entry.sha });
    }
    return out;
  }

  fetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(input);
    const method = (init.method ?? "GET").toUpperCase();
    const auth = new Headers(init.headers).get("Authorization");
    if (auth !== `Bearer ${this.token}`) return json(401, { message: "Bad credentials" });
    const path = decodeURIComponent(url.pathname);
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

    if (path === "/user") return json(200, { login: this.login, name: "Aluna Fictícia" });

    const m = /^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/.exec(path);
    if (!m) return json(404, { message: "Not Found" });
    const fullName = `${m[1]}/${m[2]}`;
    const rest = m[3] ?? "";
    const repo = this.repos.get(fullName);
    if (!repo) return json(404, { message: "Not Found" });

    if (rest === "") {
      return json(200, {
        full_name: fullName,
        private: repo.private,
        default_branch: "main",
        permissions: { push: true },
      });
    }
    if (rest.startsWith("/contents/") && method === "GET") {
      const file = rest.slice("/contents/".length);
      const ref = url.searchParams.get("ref") ?? "main";
      const content = (repo.branches[ref] ?? this.commitTrees.get(ref)?.snapshot)?.[file];
      if (!content) return json(404, { message: "Not Found" });
      return new Response(content.slice(), { status: 200 });
    }
    if (rest.startsWith("/contents/") && method === "PUT") {
      const file = rest.slice("/contents/".length);
      repo.branches.main ??= {};
      repo.branches.main[file] = b64decode(String(body.content));
      this.snapshotHead(fullName, "main");
      return json(201, {});
    }
    const ref = /^\/git\/refs?\/heads\/(.+)$/.exec(rest);
    if (ref && method === "GET") {
      const head = this.heads.get(`${fullName}#${ref[1]}`);
      if (!head || Object.keys(repo.branches[ref[1]!] ?? {}).length === 0) {
        return json(409, { message: "Git Repository is empty." });
      }
      return json(200, { object: { sha: head } });
    }
    const commitGet = /^\/git\/commits\/([0-9a-z]+)$/.exec(rest);
    if (commitGet && method === "GET") {
      const commit = this.commitTrees.get(commitGet[1]!);
      return commit
        ? json(200, { tree: { sha: commit.tree } })
        : json(404, { message: "Not Found" });
    }
    if (rest === "/git/blobs" && method === "POST") {
      const sha = this.sha("b");
      this.blobs.set(sha, b64decode(String(body.content)));
      return json(201, { sha });
    }
    if (rest === "/git/trees" && method === "POST") {
      const sha = this.sha("t");
      this.trees.set(sha, {
        base: body.base_tree ? String(body.base_tree) : null,
        entries: body.tree as { path: string; sha: string | null; type?: string }[],
      });
      return json(201, { sha });
    }
    if (rest === "/git/commits" && method === "POST") {
      const sha = this.sha("c");
      const parents = body.parents as string[];
      this.commitTrees.set(sha, { tree: String(body.tree), parent: parents[0] ?? null });
      repo.commits.push({
        sha,
        branch: "",
        message: String(body.message),
        paths: this.flatten(String(body.tree)).map((e) => e.path),
      });
      return json(201, { sha });
    }
    if (ref && method === "PATCH") {
      this.beforeUpdateRef?.(repo);
      const branch = ref[1]!;
      const head = this.heads.get(`${fullName}#${branch}`);
      const commit = this.commitTrees.get(String(body.sha));
      if (!commit || commit.parent !== head) {
        return json(422, { message: "Update is not a fast forward" });
      }
      const files = repo.branches[branch]!;
      for (const entry of this.flatten(commit.tree)) {
        if (entry.sha === null) delete files[entry.path];
        else files[entry.path] = this.blobs.get(entry.sha)!;
      }
      commit.snapshot = { ...files };
      this.views.set(commit.tree, { files: commit.snapshot, prefix: "" });
      this.heads.set(`${fullName}#${branch}`, String(body.sha));
      const record = repo.commits.find((c) => c.sha === body.sha);
      if (record) record.branch = branch;
      return json(200, {});
    }
    if (rest.startsWith("/git/trees/") && method === "GET") {
      const branch = rest.slice("/git/trees/".length);
      const view = this.views.get(branch);
      if (view) {
        const children = new Map<string, { path: string; type: string; sha: string }>();
        for (const path of Object.keys(view.files)) {
          if (!path.startsWith(view.prefix)) continue;
          const rel = path.slice(view.prefix.length);
          const cut = rel.indexOf("/");
          const head = cut < 0 ? rel : rel.slice(0, cut);
          if (children.has(head)) continue;
          if (cut < 0) children.set(head, { path: head, type: "blob", sha: this.sha("b") });
          else {
            const sub = this.sha("t");
            this.views.set(sub, { files: view.files, prefix: `${view.prefix}${head}/` });
            children.set(head, { path: head, type: "tree", sha: sub });
          }
        }
        return json(200, { tree: [...children.values()] });
      }
      const files = repo.branches[branch] ?? {};
      return json(200, { tree: Object.keys(files).map((p) => ({ path: p, type: "blob" })) });
    }
    if (rest.startsWith("/actions/runs")) {
      return json(200, { workflow_runs: [] });
    }
    return json(404, { message: `Not Found: ${method} ${rest}` });
  };
}
