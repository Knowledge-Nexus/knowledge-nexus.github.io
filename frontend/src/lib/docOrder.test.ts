import { describe, expect, it } from "vitest";
import type { DocumentRow } from "../data/types";
import { groupByYear, naturalCompare } from "./docOrder";
import { soften } from "./titles";

const doc = (name: string, year: string | null): DocumentRow =>
  ({
    id: `${year}-${name}`,
    display_name: name,
    academic_year: year,
    assessment_type: null,
    assessment_number: null,
    classification: {},
  }) as unknown as DocumentRow;

describe("ordem dentro de uma cadeira", () => {
  it("separa por ano lectivo (o mais recente primeiro) e ordena os números", () => {
    const docs = [
      doc("FT 10", "2019-2020"),
      doc("FT 2", "2019-2020"),
      doc("FT 1", "2020-2021"),
      doc("Avisos", null),
      doc("FT 0", "2019-2020"),
    ];
    const groups = groupByYear(docs, (d) => d.display_name);
    expect(groups.map((g) => g.year)).toEqual(["2020-2021", "2019-2020", null]);
    expect(groups[1]!.docs.map((d) => d.display_name)).toEqual(["FT 0", "FT 2", "FT 10"]);
    expect(naturalCompare("Teste 2", "teste 10")).toBeLessThan(0);
  });

  it("tira as maiúsculas das palavras longas, mas não das siglas", () => {
    expect(soften("FT 0 REVISÕES de CÁLCULO DIFERENCIAL")).toBe(
      "FT 0 Revisões de Cálculo Diferencial",
    );
    expect(soften("2 EQUAÇÕES DIFERENCIAIS MatII LEI 2 final")).toBe(
      "2 Equações Diferenciais MatII LEI 2 final",
    );
    expect(soften("MATIILEI1920 TPC IPRP")).toBe("MATIILEI1920 TPC IPRP");
  });
});
