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

  it("constrói a árvore pasta a pasta (sem caminhos completos) e mantém o resto", async () => {
    const { fake, source } = setup();
    const trees: { path: string }[][] = [];
    const fetchImpl = fake.fetch;
    fake.fetch = async (input: string, init: RequestInit = {}) => {
      if (String(input).endsWith("/git/trees") && init.method === "POST")
        trees.push(JSON.parse(String(init.body)).tree);
      return fetchImpl(input, init);
    };
    const client = new GitHubClient(fake.token, fake.fetch);
    const nested = new GitHubDataSource(
      client,
      { owner: "aluna", name: "estudo-dados", branch: "main" },
      "aluna",
    );
    await nested.upload(
      [{ relativePath: "UC/a.pdf", sha256: "a".repeat(64), bytes: new Uint8Array([1]) }],
      "20251001T100000Z-abcd",
    );
    expect(trees.flat().every((e) => !e.path.includes("/"))).toBe(true);
    const files = fake.repos.get(REPO)!.branches.main!;
    expect(Object.keys(files).sort()).toEqual([
      "deposito/aluna/20251001T100000Z-abcd/UC/a.pdf",
      "documentos/d1.yaml",
      "nexus.yaml",
    ]);
    await source.patchDocument(
      "d1",
      (d) => {
        d.notes = "x";
      },
      "nota",
    );
    expect(Object.keys(fake.repos.get(REPO)!.branches.main!)).toHaveLength(3);
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

describe("commits enquanto o ramo avança", () => {
  it("espera e tenta de novo sobre o novo HEAD, mesmo com vários pushes seguidos", async () => {
    const { COMMIT_RETRY } = await import("./github/commit");
    const saved = COMMIT_RETRY.delaysMs;
    COMMIT_RETRY.delaysMs = [0, 0, 0, 0, 0];
    try {
      const { fake, source } = setup();
      // O processamento grava cinco vezes seguidas: as cinco primeiras tentativas falham.
      let pushes = 0;
      fake.beforeUpdateRef = () => {
        if (pushes >= 5) return;
        pushes += 1;
        fake.externalPush(REPO, { [`documentos/p${pushes}.yaml`]: "id: p\n" });
      };
      await source.patchDocument(
        "d1",
        (doc) => {
          doc.notes = "depois de cinco pushes";
        },
        "notas",
      );
      expect(YAML.parse(fake.text(REPO, "documentos/d1.yaml")!).notes).toBe(
        "depois de cinco pushes",
      );
      expect(fake.text(REPO, "documentos/p5.yaml")).toBe("id: p\n");

      // Se o ramo avançar em todas, o erro diz o que aconteceu (e nada se perde).
      fake.beforeUpdateRef = () =>
        fake.externalPush(REPO, { "documentos/x.yaml": `n: ${Math.random()}\n` });
      const error = await source
        .patchDocument(
          "d1",
          (doc) => {
            doc.notes = "nunca entra";
          },
          "notas",
        )
        .catch((e: unknown) => e);
      expect((error as { i18nKey?: string }).i18nKey).toBe("common.branch_busy");
      expect(YAML.parse(fake.text(REPO, "documentos/d1.yaml")!).notes).toBe(
        "depois de cinco pushes",
      );
    } finally {
      COMMIT_RETRY.delaysMs = saved;
    }
  });
});

describe("estado do processamento (o que os índices ainda não têm)", () => {
  it("só as alterações que o processamento trata contam; as marcas de leitura não", async () => {
    const { fake, source } = setup();
    const client = new GitHubClient(fake.token, fake.fetch);
    const built = await client.headSha("aluna", "estudo-dados", "main");
    expect(await source.lag(built)).toEqual({ head: built, pending: false });

    fake.externalPush(REPO, { "anotacoes/aluna/d1.json": "{}", "acessos.yaml": "codes: []\n" });
    const marks = await source.lag(built);
    expect(marks?.pending).toBe(false);
    expect(marks?.head).not.toBe(built);

    // Um depósito (pela interface, por outro browser, pelo Git) é trabalho por fazer.
    fake.externalPush(REPO, { "deposito/aluna/20261121T100000Z-abcd/ficha.pdf": "%PDF" });
    expect((await source.lag(built))?.pending).toBe(true);

    // Os índices construídos a partir do último commit: em dia outra vez.
    const head = await client.headSha("aluna", "estudo-dados", "main");
    expect(await source.lag(head)).toEqual({ head, pending: false });
  });

  it("com o commit dos índices desconhecido, não se sabe (null) e não se repete o pedido", async () => {
    const { fake, source } = setup();
    let compares = 0;
    const counting = new GitHubDataSource(
      new GitHubClient(fake.token, async (input, init) => {
        if (String(input).includes("/compare/")) compares += 1;
        return fake.fetch(String(input), init);
      }),
      source.repo,
      "aluna",
    );
    expect(await counting.lag("f".repeat(40))).toBeNull();
    expect(await counting.lag("f".repeat(40))).toBeNull();
    expect(compares).toBe(1);
  });

  it("os caminhos são os do workflow do repositório de dados", async () => {
    const { readFileSync } = await import("node:fs");
    const { PIPELINE_PATHS } = await import("../lib/processing");
    const workflow = YAML.parse(
      readFileSync(
        new URL(
          "../../../backend/nexus/scaffold/template/.github/workflows/nexus.yml",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as { on: { push: { paths: string[] } } };
    const fromWorkflow = workflow.on.push.paths.map((p) => p.replace(/\*\*$/, ""));
    expect([...PIPELINE_PATHS].sort()).toEqual([...fromWorkflow].sort());
  });
});

describe("ficheiros que deram erro e arquivos .rar", () => {
  it("«Tentar de novo» acrescenta `repetir:` ao registo (uma vez) num só commit", async () => {
    const { fake, source } = setup();
    const log = "deposito/aluna/_erros/20261001T231500Z-abcd/a.rar.log";
    fake.externalPush(REPO, {
      [log]: "data: x\nitem: aluna/20261001T231500Z-abcd/a.rar\nerro: NotRarFile\n",
    });
    await source.retryFailed([log, "deposito/aluna/_erros/ja-tratado.zip.log"]);
    const text = fake.text(REPO, log)!;
    expect(text).toMatch(/\nrepetir: \d{4}-\d{2}-\d{2}T/);
    expect(fake.text(REPO, "deposito/aluna/_erros/ja-tratado.zip.log")).toBeUndefined();
    const commits = fake.repos.get(REPO)!.commits.length;
    await source.retryFailed([log]);
    expect(fake.text(REPO, log)).toBe(text);
    expect(fake.repos.get(REPO)!.commits.length).toBe(commits);
  });

  it("«Extrair os ficheiros dos .rar» vai nas opções do lote", async () => {
    const { fake, source } = setup();
    const entry = { relativePath: "a.rar", sha256: "f".repeat(64), bytes: new Uint8Array([1]) };
    await source.upload([entry], "20261122T100000Z-abcd", undefined, { openArchives: true });
    expect(fake.text(REPO, "deposito/aluna/20261122T100000Z-abcd/.nexus-opcoes.yaml")).toBe(
      "open_archives: true\n",
    );
    await source.upload([entry], "20261122T100100Z-abcd");
    expect(
      fake.text(REPO, "deposito/aluna/20261122T100100Z-abcd/.nexus-opcoes.yaml"),
    ).toBeUndefined();
  });

  it("os formatos guardados inteiros são os das predefinições do motor", async () => {
    const { readFileSync } = await import("node:fs");
    const { KEEP_WHOLE_EXTS } = await import("../lib/processing");
    const defaults = YAML.parse(
      readFileSync(new URL("../../../config/predefinicoes.yaml", import.meta.url), "utf8"),
    ) as { archives: { keep_whole: string[] } };
    expect([...KEEP_WHOLE_EXTS]).toEqual(defaults.archives.keep_whole);
  });
});
