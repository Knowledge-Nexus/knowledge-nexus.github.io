import { describe, expect, it } from "vitest";
import type { DocumentRow } from "../data/types";
import { typeToConfirm } from "../features/library/LibraryPage";

const doc = (reasons: { code: string }[], method = "heuristic") =>
  ({
    classification: { document_type: { value: "slides", confidence: 0.5, method, reasons } },
  }) as unknown as DocumentRow;

describe("tipo por confirmar", () => {
  it("só quando o motor o marcou", () => {
    expect(typeToConfirm(doc([{ code: "term.keyword" }, { code: "type.to_confirm" }]))).toBe(true);
    expect(typeToConfirm(doc([{ code: "term.keyword" }]))).toBe(false);
    expect(typeToConfirm({ classification: {} } as unknown as DocumentRow)).toBe(false);
  });
});
