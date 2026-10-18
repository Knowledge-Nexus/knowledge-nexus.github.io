import { describe, expect, it } from "vitest";
import { setUserField } from "./DocumentFields";

describe("editar um campo do documento", () => {
  it("grava o valor como escolha da pessoa", () => {
    const record: Record<string, unknown> = {
      classification: { unit: { value: "ufe/am1", confidence: 0.4, method: "heuristic" } },
    };
    setUserField(record, "assessment_number", "2", "aluna");
    setUserField(record, "unit", "ufe/fg", "aluna");
    const c = record.classification as Record<string, { value: unknown; method: string }>;
    expect(c.assessment_number).toMatchObject({ value: 2, method: "user" });
    expect(c.unit).toMatchObject({ value: "ufe/fg", method: "user", confidence: 1 });
  });

  it("sem valor fica como escolha; o nome volta ao automático", () => {
    const record: Record<string, unknown> = {};
    setUserField(record, "exam_season", "", "aluna");
    setUserField(record, "title", "  Resumo do capítulo 3 ", "aluna");
    let c = record.classification as Record<string, { value: unknown; method: string }>;
    expect(c.exam_season).toMatchObject({ value: null, method: "user" });
    expect(c.title?.value).toBe("Resumo do capítulo 3");
    setUserField(record, "title", null, "aluna");
    c = record.classification as Record<string, { value: unknown; method: string }>;
    expect(c.title).toBeUndefined();
  });
});
