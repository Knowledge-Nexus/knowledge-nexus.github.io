import { describe, expect, it } from "vitest";
import { unitRef } from "./courseLinks";

describe("unitRef", () => {
  it("usa o slug na mesma instituição e a chave completa noutra", () => {
    expect(unitRef("ufe", "ufe/am1")).toBe("am1");
    expect(unitRef("iscsp", "ulisboa/iad")).toBe("ulisboa/iad");
  });
});
