// Teste de contrato: o índice gerado pelo motor Python (tests/contrato/gerar_indice.py)
// tem de ser lido por estas consultas e dar os mesmos resultados de pesquisa.
// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { normalize } from "../../lib/normalize";
import { ReadonlyDb } from "./db";
import { MetaIndex, MIN_SCHEMA_VERSION, SUPPORTED_SCHEMA_VERSION } from "./queries";
import { SearchIndex } from "./search";

const dir = resolve(__dirname, "../../../test-fixtures/contrato");
const vectors = resolve(__dirname, "../../../../tests/contrato/normalizacao.json");
const hasIndex = existsSync(resolve(dir, "meta.db"));

describe("normalização partilhada com o Python", () => {
  it("dá os mesmos resultados", () => {
    const pairs = JSON.parse(readFileSync(vectors, "utf-8")) as [string, string][];
    for (const [text, expected] of pairs) expect(normalize(text), text).toBe(expected);
  });
});

describe.skipIf(!hasIndex)("índice de contrato", () => {
  const expected = hasIndex
    ? (JSON.parse(readFileSync(resolve(dir, "esperado.json"), "utf-8")) as {
        owner: string;
        documents: string[];
        review: string[];
        removed: string[];
        search: Record<string, [string, number][]>;
        search_other_viewer: [string, number][];
        questions: Record<string, string[]>;
      })
    : null;

  it("continua a ler um índice do esquema anterior (sem o banco de perguntas)", async () => {
    const meta = new MetaIndex(await ReadonlyDb.open(readFileSync(resolve(dir, "meta-v4.db"))));
    expect(meta.schemaVersion()).toBe(MIN_SCHEMA_VERSION);
    const docs = meta.documents({ includeArchives: true });
    expect(docs.map((d) => d.id).sort()).toEqual(expected!.documents);
    expect(meta.reviewQueue().length).toBeGreaterThan(0);
    expect(meta.questions(Object.keys(expected!.questions))).toEqual([]);
    expect(meta.questionCounts().size).toBe(0);
  });

  it("lê o banco de perguntas: só as que se mostram, pela ordem do exame", async () => {
    const meta = new MetaIndex(await ReadonlyDb.open(readFileSync(resolve(dir, "meta.db"))));
    for (const [sha, labels] of Object.entries(expected!.questions)) {
      const rows = meta.questions([sha]);
      expect(rows.map((q) => q.label)).toEqual(labels);
      expect(rows.every((q) => Array.isArray(q.pages) && q.pages.length > 0)).toBe(true);
      expect(rows[0]!.generated_by).toBe("ai:claude-code");
      expect(meta.questionCounts().get(sha)).toBe(labels.length);
      // As do exame com fórmulas ficam de fora: nenhum outro enunciado tem perguntas visíveis.
      expect(meta.questionCounts().size).toBe(1);
    }
  });

  it("lê meta.db com o esquema suportado", async () => {
    const meta = new MetaIndex(await ReadonlyDb.open(readFileSync(resolve(dir, "meta.db"))));
    expect(meta.schemaVersion()).toBe(SUPPORTED_SCHEMA_VERSION);
    const ids = meta
      .documents({ includeArchives: true })
      .map((d) => d.id)
      .sort();
    expect(ids).toEqual(expected!.documents);
    expect(
      meta
        .reviewQueue()
        .map((d) => d.id)
        .sort(),
    ).toEqual(expected!.review);
    const doc = meta.documents()[0]!;
    expect(typeof doc.classification).toBe("object");
    expect(Array.isArray(doc.sources)).toBe(true);
    expect(meta.vocab("document_types").length).toBeGreaterThanOrEqual(12);
    expect(meta.units().find((u) => u.key === "ufe/am1")?.name).toBe("Análise Matemática I");
    // O que foi para o caixote do lixo só aparece em «Removidos» (e na sua própria página).
    expect(meta.removed(expected!.owner).map((d) => d.id)).toEqual(expected!.removed);
    expect(meta.document(expected!.removed[0]!)?.status).toBe("removed");
    // Consultas da página Início.
    const owned = meta.documents({ owner: expected!.owner });
    const recent = meta.recent(expected!.owner, 100);
    expect(recent.map((d) => d.id).sort()).toEqual(owned.map((d) => d.id).sort());
    const stats = meta.unitStats(expected!.owner);
    const withUnit = owned.filter((d) => d.unit);
    expect([...stats.values()].reduce((n, s) => n + s.total, 0)).toBe(withUnit.length);
    for (const s of stats.values()) expect(s.filed).toBeLessThanOrEqual(s.total);
    const counts = meta.counts(expected!.owner);
    expect(counts.review).toBe(expected!.review.length);
    expect(counts.total).toBe(owned.filter((d) => d.kind !== "archive").length);
  });

  it("pesquisa como o Python", async () => {
    const search = new SearchIndex(
      await ReadonlyDb.open(gunzipSync(readFileSync(resolve(dir, "pesquisa.db.gz")))),
    );
    for (const [query, hits] of Object.entries(expected!.search)) {
      const got = search.search(query, expected!.owner).map((h) => [h.doc_id, h.page]);
      expect(got, query).toEqual(hits);
    }
    expect(search.search("sucessao", "x")).toEqual(expected!.search_other_viewer);
  });
});
