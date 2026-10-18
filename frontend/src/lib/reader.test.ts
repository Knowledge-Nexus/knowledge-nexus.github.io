import { describe, expect, it } from "vitest";
import { nextPage, previousPage, spreadPages } from "./reader";

describe("páginas à vista no modo de leitura", () => {
  it("uma página de cada vez", () => {
    expect(spreadPages(3, 10, false)).toEqual([3]);
    expect(nextPage(3, 10, false)).toBe(4);
    expect(previousPage(3, 10, false)).toBe(2);
    expect(nextPage(10, 10, false)).toBe(10);
    expect(previousPage(1, 10, false)).toBe(1);
  });

  it("como livro: a capa sozinha e depois aos pares", () => {
    expect(spreadPages(1, 10, true)).toEqual([1]);
    expect(spreadPages(2, 10, true)).toEqual([2, 3]);
    expect(spreadPages(3, 10, true)).toEqual([2, 3]);
    expect(spreadPages(10, 10, true)).toEqual([10]);
    expect(spreadPages(9, 9, true)).toEqual([8, 9]);
    expect(nextPage(1, 10, true)).toBe(2);
    expect(nextPage(3, 10, true)).toBe(4);
    expect(previousPage(4, 10, true)).toBe(2);
    expect(previousPage(2, 10, true)).toBe(1);
    expect(spreadPages(40, 10, true)).toEqual([10]);
  });
});
