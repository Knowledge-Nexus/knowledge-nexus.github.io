import { describe, expect, it } from "vitest";
import type { MetaIndex } from "../data/sqlite/queries";
import type { DocumentRow } from "../data/types";
import {
  hideRemoved,
  markRemoved,
  settleRemovals,
  showRestored,
  removalSnapshot as snapshot,
  unmarkRemoved,
  withCopies,
} from "./removal";

const row = (id: string, extra: Partial<DocumentRow> = {}) => ({ id, ...extra }) as DocumentRow;

function fakeMeta(docs: DocumentRow[]): MetaIndex {
  return {
    copiesOf: (id: string, includeRemoved = false) =>
      docs.filter((d) => d.duplicate_of === id && (includeRemoved || d.status !== "removed")),
    document: (id: string) => docs.find((d) => d.id === id),
  } as unknown as MetaIndex;
}

describe("remover documentos", () => {
  it("marca e desmarca o registo", () => {
    const record: Record<string, unknown> = { id: "a" };
    markRemoved(record, "aluna");
    expect(record.removed).toMatchObject({ by: "aluna" });
    expect(String((record.removed as { at: string }).at)).toMatch(/Z$/);
    unmarkRemoved(record);
    expect("removed" in record).toBe(false);
  });

  it("as cópias exactas saem e voltam com o original", () => {
    const meta = fakeMeta([
      row("a"),
      row("b", { duplicate_of: "a" }),
      row("c", { duplicate_of: "a", status: "removed" }),
      row("d"),
    ]);
    expect(withCopies(meta, [row("a"), row("d")])).toEqual(["a", "b", "d"]);
    expect(withCopies(meta, [row("a")], true)).toEqual(["a", "b", "c"]);
  });

  it("esconde até o índice novo chegar", () => {
    hideRemoved(["x", "y"]);
    expect(snapshot().hidden).toEqual(new Set(["x", "y"]));
    showRestored(["y"]);
    expect(snapshot().hidden).toEqual(new Set(["x"]));
    expect(snapshot().restored).toEqual(new Set(["y"]));
    // Índice antigo: continua escondido. Índice novo: já não é preciso.
    settleRemovals(fakeMeta([row("x", { status: "classified" }), row("y", { status: "removed" })]));
    expect(snapshot().hidden).toEqual(new Set(["x"]));
    expect(snapshot().restored).toEqual(new Set(["y"]));
    settleRemovals(fakeMeta([row("x", { status: "removed" }), row("y", { status: "filed" })]));
    expect(snapshot().hidden).toEqual(new Set());
    expect(snapshot().restored).toEqual(new Set());
  });
});
