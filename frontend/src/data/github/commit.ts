// Um commit atómico com vários ficheiros (Git Data API), com novas tentativas quando o
// ramo avança entretanto (ex.: o pipeline fez push). As alterações "update" são
// recalculadas sobre a versão mais recente do ficheiro, para nunca sobrepor trabalho alheio.

import { type GitHubClient, GitHubError, type TreeEntry } from "./client";

export type Change =
  | { path: string; content: Uint8Array | string | null }
  | { path: string; update: (current: string | null) => string | null };

export interface RepoRef {
  owner: string;
  name: string;
  branch: string;
}

const encoder = new TextEncoder();

async function readCurrent(client: GitHubClient, repo: RepoRef, path: string, ref: string) {
  try {
    return await client.rawText(repo.owner, repo.name, path, ref);
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }
}

export async function commitChanges(
  client: GitHubClient,
  repo: RepoRef,
  changes: Change[],
  message: string,
  maxAttempts = 5,
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  // Blobs de conteúdo fixo: criados uma vez e reaproveitados entre tentativas.
  const fixed = new Map<string, string | null>();
  const total = changes.filter((c) => "content" in c).length;
  let done = 0;
  for (const change of changes) {
    if ("content" in change) {
      if (change.content === null) {
        fixed.set(change.path, null);
      } else {
        const bytes =
          typeof change.content === "string" ? encoder.encode(change.content) : change.content;
        fixed.set(change.path, await client.createBlob(repo.owner, repo.name, bytes));
      }
      onProgress?.(++done, total);
    }
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const head = await client.headSha(repo.owner, repo.name, repo.branch);
    const baseTree = await client.commitTree(repo.owner, repo.name, head);
    const tree: TreeEntry[] = [];
    for (const change of changes) {
      let sha: string | null | undefined = fixed.get(change.path);
      if ("update" in change) {
        const current = await readCurrent(client, repo, change.path, head);
        const next = change.update(current);
        if (next === current) continue;
        sha =
          next === null
            ? null
            : await client.createBlob(repo.owner, repo.name, encoder.encode(next));
      }
      tree.push({ path: change.path, mode: "100644", type: "blob", sha: sha ?? null });
    }
    if (tree.length === 0) return head;
    const treeSha = await client.createTree(repo.owner, repo.name, baseTree, tree);
    const commit = await client.createCommit(repo.owner, repo.name, message, treeSha, head);
    try {
      await client.updateRef(repo.owner, repo.name, repo.branch, commit);
      return commit;
    } catch (error) {
      // 422: não é fast-forward (o ramo avançou). Tenta de novo sobre o novo HEAD.
      if (!(error instanceof GitHubError) || error.status !== 422) throw error;
      lastError = error;
    }
  }
  throw lastError ?? new Error("não foi possível gravar as alterações");
}
