import { describe, expect, it } from "vitest";
import { sameCourseName } from "../features/library/CourseManager";

describe("sameCourseName", () => {
  it("só confirma com o nome do curso (sem ligar a maiúsculas nem espaços)", () => {
    expect(sameCourseName("  administração   pública ", "Administração Pública")).toBe(true);
    expect(sameCourseName("Administração", "Administração Pública")).toBe(false);
    expect(sameCourseName("Administracao Publica", "Administração Pública")).toBe(false);
    expect(sameCourseName("", "")).toBe(false);
  });
});
