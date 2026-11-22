// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import type { VocabTerm } from "../data/types";
import { TYPE_PALETTE, typeColor } from "./typeColors";

const term = (slug: string, color: string | null) => ({ slug, color }) as VocabTerm;

describe("cores dos tipos", () => {
  it("usa a cor do vocabulário e, sem ela, uma estável pelo slug", () => {
    const types = [term("fichas", "green"), term("novo", null), term("estranho", "rosa")];
    expect(typeColor(types, "fichas")).toBe("var(--color-type-green)");
    expect(typeColor(types, "novo")).toBe(typeColor(types, "novo"));
    expect(typeColor(types, "novo")).toMatch(/^var\(--color-type-[a-z-]+\)$/);
    expect(typeColor(types, "estranho")).not.toContain("rosa");
    expect(typeColor(types, null)).toBe("var(--color-line-strong)");
  });

  it("todas as cores do vocabulário existem na paleta e no CSS", () => {
    const vocab = YAML.parse(
      readFileSync(new URL("../../../config/vocabularios.yaml", import.meta.url), "utf8"),
    ) as { document_types: { color?: string }[] };
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    for (const { color } of vocab.document_types) {
      expect(TYPE_PALETTE).toContain(color);
    }
    for (const name of TYPE_PALETTE) expect(css).toContain(`--color-type-${name}:`);
  });
});
