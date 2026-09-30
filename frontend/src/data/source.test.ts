// @vitest-environment node
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { GitHubClient } from "./github/client";
import { FakeGitHub } from "./github/fake";
import { GitHubDataSource } from "./source";

const REPO = "aluna/estudo-dados";

function setup() {
  const fake = new FakeGitHub();
  fake.addRepo(REPO, {
    "nexus.yaml": "format_version: 1\nowner: aluna\n",
    "documentos/d1.yaml": YAML.stringify({ id: "d1", owner: "aluna", notes: "" }),
  });
  const client = new GitHubClient(fake.token, fake.fetch);
  const source = new GitHubDataSource(
    client,
    { owner: "aluna", name: "estudo-dados", branch: "main" },
    "aluna",
  );
  return { fake, source };
}

describe("GitHubDataSource", () => {
  it("envia um lote num só commit, com referência para conteúdo já conhecido", async () => {
    const { fake, source } = setup();
    await source.upload(
      [
        {
          relativePath: "AM1/exame.pdf",
          sha256: "a".repeat(64),
          bytes: new Uint8Array([37, 80, 68, 70]),
        },
        { relativePath: "copia.pdf", sha256: "b".repeat(64) },
      ],
      "20251001T100000Z-abcd",
    );
    const repo = fake.repos.get(REPO)!;
    const commit = repo.commits.at(-1)!;
    expect(commit.paths.sort()).toEqual([
      "deposito/aluna/20251001T100000Z-abcd/AM1/exame.pdf",
      "deposito/aluna/20251001T100000Z-abcd/copia.pdf.ref.yaml",
    ]);
    const ref = YAML.parse(
      fake.text(REPO, "deposito/aluna/20251001T100000Z-abcd/copia.pdf.ref.yaml")!,
    );
    expect(ref).toEqual({ sha256: "b".repeat(64), path: "copia.pdf" });
  });

  it("repete sobre o novo HEAD quando o ramo avança e não perde alterações alheias", async () => {
    const { fake, source } = setup();
    let pushed = false;
    fake.beforeUpdateRef = () => {
      if (pushed) return;
      pushed = true;
      fake.externalPush(REPO, {
        "documentos/d1.yaml": YAML.stringify({
          id: "d1",
          owner: "aluna",
          notes: "",
          status: "filed",
        }),
      });
    };
    await source.patchDocument(
      "d1",
      (doc) => {
        doc.notes = "rever o grupo II";
      },
      "notas",
    );
    const doc = YAML.parse(fake.text(REPO, "documentos/d1.yaml")!);
    expect(doc).toMatchObject({ notes: "rever o grupo II", status: "filed" });
  });

  it("sem índices publicados devolve manifest nulo", async () => {
    const { source } = setup();
    expect(await source.manifest()).toBeNull();
    expect(await source.structureReady()).toBe(true);
  });

  it("pedido de catálogo vai para catalogo/_importar", async () => {
    const { fake, source } = setup();
    await source.catalogRequest(
      { format: "nexus-catalogo", version: 1, proposals: { reject: ["unit-x"] } },
      "rejeitar",
    );
    const paths = fake.repos.get(REPO)!.commits.at(-1)!.paths;
    expect(paths).toHaveLength(1);
    expect(paths[0]).toMatch(/^catalogo\/_importar\/.+\.yaml$/);
  });
});
