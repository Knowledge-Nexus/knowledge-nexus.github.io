// @vitest-environment node

import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { GitHubClient } from "./github/client";
import { FakeGitHub } from "./github/fake";
import { GitHubDataSource, LOTE_MIN_FILES, splitUpload, UPLOAD_PART_BYTES } from "./source";

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
  it("muitos ficheiros vão num lote zip (poucos pedidos à API)", async () => {
    const { fake, source } = setup();
    const entries = Array.from({ length: LOTE_MIN_FILES + 5 }, (_, i) => ({
      relativePath: `UC/POO/ficha${i}.pdf`,
      sha256: String(i).padStart(64, "0"),
      bytes: new TextEncoder().encode(`%PDF ficha ${i}`),
    }));
    entries.push({ relativePath: "UC/POO/copia.pdf", sha256: "c".repeat(64) } as never);
    await source.upload(entries, "20251001T100000Z-abcd");
    const repo = fake.repos.get(REPO)!;
    const commit = repo.commits.at(-1)!;
    expect(commit.paths).toEqual(["deposito/aluna/20251001T100000Z-abcd/_lote-001.nexus-lote.zip"]);
    const zip = repo.branches.main![commit.paths[0]!] as Uint8Array;
    const files = unzipSync(zip);
    expect(Object.keys(files)).toHaveLength(LOTE_MIN_FILES + 6);
    expect(new TextDecoder().decode(files["UC/POO/ficha3.pdf"])).toBe("%PDF ficha 3");
    expect(YAML.parse(new TextDecoder().decode(files["UC/POO/copia.pdf.ref.yaml"]))).toEqual({
      sha256: "c".repeat(64),
      path: "UC/POO/copia.pdf",
    });
  });

  it("volta a tentar depois de uma falha de rede e de um limite de ritmo", async () => {
    const { fake } = setup();
    let calls = 0;
    const flaky = async (input: string, init?: RequestInit) => {
      calls += 1;
      if (calls === 1) throw new TypeError("Failed to fetch");
      if (calls === 2)
        return new Response(
          JSON.stringify({ message: "You have exceeded a secondary rate limit" }),
          {
            status: 403,
            headers: { "retry-after": "1" },
          },
        );
      return fake.fetch(input, init);
    };
    const waits: number[] = [];
    const client = new GitHubClient(
      fake.token,
      flaky,
      "https://api.github.com",
      5,
      10,
      async (ms) => {
        waits.push(ms);
      },
    );
    const user = await client.user();
    expect(user.login).toBe("aluna");
    expect(waits).toEqual([10, 1000]);
  });

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

describe("ficheiros grandes vão em partes", () => {
  it("divide acima do limite e descreve as partes num manifesto", () => {
    const bytes = new Uint8Array(UPLOAD_PART_BYTES * 2 + 5).map((_, i) => i % 251);
    const changes = splitUpload("deposito/a/l/grande.pdf", {
      relativePath: "grande.pdf",
      sha256: "f".repeat(64),
      bytes,
    });
    const paths = changes.map((c) => c.path);
    expect(paths).toEqual([
      "deposito/a/l/grande.pdf.nexus-part-0001",
      "deposito/a/l/grande.pdf.nexus-part-0002",
      "deposito/a/l/grande.pdf.nexus-part-0003",
      "deposito/a/l/grande.pdf.nexus-parts.yaml",
    ]);
    const parts = changes.slice(0, 3).map((c) => ("content" in c ? c.content : null));
    expect(parts.reduce((n, p) => n + (p as Uint8Array).length, 0)).toBe(bytes.length);
    const manifest = changes[3]!;
    expect("content" in manifest && YAML.parse(manifest.content as string)).toEqual({
      path: "grande.pdf",
      size: bytes.length,
      sha256: "f".repeat(64),
      parts: 3,
    });
  });

  it("não mexe nos pequenos", () => {
    const bytes = new Uint8Array(10);
    expect(splitUpload("x", { relativePath: "x", sha256: "0", bytes })).toEqual([
      { path: "x", content: bytes },
    ]);
  });
});
