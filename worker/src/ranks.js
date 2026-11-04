// Níveis de acesso das contas, do menor para o maior. Cada um pode tudo o que o anterior pode.
//
//   none         à espera: só o material público
//   viewer       Observador: vê e lê tudo no site, sem descarregar
//   reader       Leitor: também descarrega
//   contributor  Colaborador: também deposita material novo (só `deposito/<dono>/`)
//   organizer    Organizador: também arruma (A rever, classificação, cadeiras, cursos...),
//                sem mudar o que é público
//   editor       Editor: tudo o que a interface faz, incluindo o que é público
//
// Ninguém com conta mexe no que é só do dono: configuração (`nexus.yaml`), códigos de acesso
// (`acessos.yaml`), workflows e originais. Quem decide é o Worker, commit a commit (`checkCommit`).

import { HttpError } from "./util.js";

export const RANKS = ["none", "viewer", "reader", "contributor", "organizer", "editor"];
const LEVEL = Object.fromEntries(RANKS.map((rank, index) => [rank, index]));

export const isRank = (value) => Object.hasOwn(LEVEL, value);
/** O nível chega a `rank` (ex.: `atLeast("organizer", "reader")`). */
export const atLeast = (role, rank) => (LEVEL[role] ?? 0) >= LEVEL[rank];

const OWNER_ONLY = [/^\.github\//, /^\.claude\//, /^acessos\.yaml$/, /^nexus\.yaml$/, /^originais\//];

/** Pode este nível gravar (ou apagar) este caminho? */
export function pathAllowed(role, path, owner) {
  if (OWNER_ONLY.some((re) => re.test(path))) return false;
  if (role === "contributor") return path.startsWith(`deposito/${owner}/`);
  // A visibilidade por cadeira e por tipo fica em `utilizadores/` (só o editor a muda).
  if (role === "organizer") return !path.startsWith("utilizadores/");
  return role === "editor";
}

/** No diff de um documento, uma linha `visibility:` mudou (o que é público). */
export const changesVisibility = (patch) => /^[+-]visibility:/m.test(patch ?? "");

const MAX_FILES = 300; // a comparação do GitHub lista até 300 ficheiros

/**
 * Antes de mover o ramo para um commit feito por uma conta: o commit tem de vir logo a seguir
 * ao actual (um só pai) e só mudar o que o nível permite. Usa a comparação do GitHub
 * (3 pedidos, qualquer que seja o tamanho do commit).
 */
export async function checkCommit({ role, owner, head, commit, compare }) {
  if (commit.parents?.length !== 1 || commit.parents[0].sha !== head)
    throw new HttpError(403, "commit_invalido");
  const files = compare.files ?? [];
  if (files.length >= MAX_FILES) throw new HttpError(403, "demasiados_ficheiros");
  for (const file of files) {
    for (const path of [file.filename, file.previous_filename].filter(Boolean)) {
      if (!pathAllowed(role, path, owner))
        throw new HttpError(403, "fora_do_teu_nivel", { path });
    }
    if (role === "organizer" && /^documentos\//.test(file.filename)) {
      // Sem diff (ficheiro grande ou binário) não se sabe se mexeu na visibilidade.
      if (typeof file.patch !== "string" || changesVisibility(file.patch))
        throw new HttpError(403, "so_o_editor_publica", { path: file.filename });
    }
  }
}
