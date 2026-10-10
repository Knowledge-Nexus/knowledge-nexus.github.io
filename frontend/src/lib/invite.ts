// Acesso temporário: o dono cria no GitHub um token só para o repositório de dados, com
// prazo, e a interface embrulha-o num código para dar a outra pessoa. Quem tiver o código
// entra sem conta própria até o token expirar (ou até o dono o apagar no GitHub). O que essa
// pessoa grava leva o nome dela na mensagem do commit.
//
// O código NÃO é cifrado: é o próprio token, por isso é tão secreto como ele.

export interface Invite {
  /** "dono/nome" do repositório de dados. */
  repo: string;
  token: string;
  /** Nome de quem recebe o acesso (fica nas mensagens dos commits). */
  name: string;
  /** Fim previsto do acesso (ISO), só para mostrar; quem manda é o prazo do token. */
  until?: string;
}

const PREFIX = "KN1-";

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeInvite(invite: Invite): string {
  return PREFIX + toBase64Url(JSON.stringify(invite));
}

/** O convite contido no código, ou null se não for um código válido. */
export function decodeInvite(code: string): Invite | null {
  const cleaned = code.replace(/\s+/g, "");
  if (!cleaned.startsWith(PREFIX)) return null;
  try {
    const data = JSON.parse(fromBase64Url(cleaned.slice(PREFIX.length))) as Partial<Invite>;
    if (typeof data.repo !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(data.repo)) return null;
    if (typeof data.token !== "string" || !data.token) return null;
    return {
      repo: data.repo,
      token: data.token,
      name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "convidado",
      ...(typeof data.until === "string" ? { until: data.until } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Página do GitHub para criar o token, já preenchida: nome, descrição, dono do repositório,
 * prazo e permissões (conteúdo: escrita; Actions: leitura, para o estado do processamento).
 * O repositório em si escolhe-se à mão ("Only select repositories").
 */
export function tokenPageUrl(owner: string, repoName: string, person: string, days: number) {
  const name = `Knowledge Nexus: ${person}`.slice(0, 40);
  const params = new URLSearchParams({
    name,
    description: `Acesso temporário de ${person} a ${owner}/${repoName} (Knowledge Nexus).`,
    target_name: owner,
    expires_in: String(days),
    contents: "write",
    actions: "read",
  });
  return `https://github.com/settings/personal-access-tokens/new?${params}`;
}

/** Linha acrescentada às mensagens dos commits feitos com um código de acesso. */
export function guestTrailer(name: string): string {
  return `Feito por: ${name} (acesso temporário)`;
}
