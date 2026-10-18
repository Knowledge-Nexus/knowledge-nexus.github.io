import { describe, expect, it } from "vitest";
import {
  emptyAnnotations,
  hitsStroke,
  markCount,
  markedPages,
  parseAnnotations,
  pushHistory,
  redoHistory,
  rotatedBox,
  type Stroke,
  simplify,
  startHistory,
  straighten,
  stringifyAnnotations,
  toPage,
  undoHistory,
  withPage,
} from "./annotations";

const stroke = (points: number[], extra: Partial<Stroke> = {}): Stroke => ({
  id: "a1",
  kind: "pen",
  color: "ink",
  width: 20,
  points,
  ...extra,
});

describe("marcas de leitura", () => {
  it("grava e volta a ler o mesmo ficheiro, um traço por linha", () => {
    const file = {
      ...emptyAnnotations("doc-1", "ab"),
      pages: { "10": [stroke([1, 2, 3, 4])], "2": [stroke([5, 6], { kind: "highlight" })] },
    };
    const text = stringifyAnnotations(file);
    expect(text.indexOf('"2"')).toBeLessThan(text.indexOf('"10"'));
    expect(text.split("\n").filter((l) => l.includes('"points"'))).toHaveLength(2);
    expect(parseAnnotations(text)).toEqual(file);
    expect(parseAnnotations(stringifyAnnotations(emptyAnnotations("d", "s")))?.pages).toEqual({});
  });

  it("deixa de fora o que não se percebe", () => {
    const text = JSON.stringify({
      format: "nexus-anotacoes",
      document: "d",
      pages: { "1": [stroke([1, 2]), { id: "x", kind: "laser", points: [1, 2] }], abc: [] },
    });
    expect(parseAnnotations(text)?.pages["1"]).toHaveLength(1);
    expect(parseAnnotations("{nada")).toBeNull();
    expect(parseAnnotations(JSON.stringify({ format: "outro" }))).toBeNull();
  });

  it("conta as marcas e as páginas marcadas", () => {
    const pages = { "3": [stroke([1, 1]), stroke([2, 2])], "1": [stroke([1, 1])] };
    expect(markCount(pages)).toBe(3);
    expect(markedPages(pages)).toEqual([
      { page: 1, count: 1 },
      { page: 3, count: 2 },
    ]);
    expect(withPage(pages, 3, [])).toEqual({ "1": pages["1"] });
  });

  it("converte o que se vê rodado para as coordenadas da página", () => {
    const [w, h] = [1000, 1400];
    expect(rotatedBox(90, w, h)).toEqual([h, w]);
    // Canto superior esquerdo da página: rodado 90°, aparece no canto superior direito.
    expect(toPage(h, 0, 90, w, h)).toEqual([0, 0]);
    expect(toPage(w, h, 180, w, h)).toEqual([0, 0]);
    expect(toPage(0, w, 270, w, h)).toEqual([0, 0]);
    expect(toPage(10, 20, 0, w, h)).toEqual([10, 20]);
  });

  it("endireita o marcador quase na horizontal do que se vê", () => {
    expect(straighten(0, 100, 500, 130)).toEqual([500, 100]);
    expect(straighten(0, 100, 500, 400)).toEqual([500, 400]);
    // Página rodada: a linha do texto corre na vertical da página.
    expect(straighten(100, 0, 130, 500, 90)).toEqual([100, 500]);
  });

  it("simplifica traços à mão e a borracha toca-lhes", () => {
    expect(simplify([0, 0, 1, 1, 2, 2, 50, 50, 100, 100], 10)).toEqual([0, 0, 50, 50, 100, 100]);
    const line = stroke([0, 0, 1000, 0]);
    expect(hitsStroke(line, 500, 25, 20)).toBe(true);
    expect(hitsStroke(line, 500, 80, 20)).toBe(false);
    expect(hitsStroke(stroke([10, 10]), 12, 12, 5)).toBe(true);
  });

  it("desfaz e refaz", () => {
    let history = startHistory({});
    history = pushHistory(history, { "1": [stroke([1, 1])] });
    history = pushHistory(history, {});
    expect(history.present).toEqual({});
    history = undoHistory(history);
    expect(history.present["1"]).toHaveLength(1);
    history = redoHistory(history);
    expect(history.present).toEqual({});
    expect(redoHistory(history)).toBe(history);
    expect(undoHistory(startHistory({}))).toEqual(startHistory({}));
  });
});
