// Os códigos de acesso KN1-… que o dono deu: neste browser (localStorage, como sempre) e,
// quando o Worker tem contas, também guardados lá, cifrados, para os ver em qualquer browser
// onde entre como administrador. Ao abrir as Definições, o que só está neste browser sobe.

import { AccountsApi } from "../data/accounts";
import type { GitHubDataSource } from "../data/source";
import { storeCode, storedCodes } from "./access";

const api = new AccountsApi();
let available: Promise<boolean> | null = null;

function vaultReady(source: GitHubDataSource): Promise<boolean> {
  if (!source.isOwner) return Promise.resolve(false);
  available ??= api.config().then(Boolean, () => false);
  return available;
}

const repoName = (source: GitHubDataSource) => `${source.repo.owner}/${source.repo.name}`;

export interface LoadedCodes {
  codes: Record<string, string>;
  /** Estão guardados no Worker (vêem-se noutros browsers). */
  synced: boolean;
  /** Guardados com uma chave que o Worker já não tem. */
  unreadable: number;
}

/** Os deste browser e os guardados; os que só estão aqui sobem para o Worker. */
export async function loadCodes(source: GitHubDataSource, known: string[]): Promise<LoadedCodes> {
  const repo = repoName(source);
  const local = storedCodes(repo);
  if (!(await vaultReady(source))) return { codes: local, synced: false, unreadable: 0 };
  try {
    const token = source.client.token;
    const saved = await api.codes(token, repo);
    const missing = Object.fromEntries(
      Object.entries(local).filter(([id, code]) => known.includes(id) && saved.codes[id] !== code),
    );
    if (Object.keys(missing).length) await api.saveCodes(token, repo, missing);
    return {
      codes: { ...saved.codes, ...local },
      synced: true,
      unreadable: saved.unreadable,
    };
  } catch {
    // Sem ligação ao Worker: ficam os deste browser.
    return { codes: local, synced: false, unreadable: 0 };
  }
}

/** Guarda (ou esquece, com `null`) o código de um acesso: aqui e no Worker. */
export async function saveCode(
  source: GitHubDataSource,
  id: string,
  code: string | null,
): Promise<void> {
  const repo = repoName(source);
  storeCode(repo, id, code);
  if (!(await vaultReady(source))) return;
  try {
    if (code) await api.saveCodes(source.client.token, repo, { [id]: code });
    else await api.removeCode(source.client.token, repo, id);
  } catch {
    // Fica neste browser; sobe da próxima vez que se abrirem as Definições.
  }
}
