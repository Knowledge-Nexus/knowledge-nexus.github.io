import { describe, expect, it } from "vitest";
import { decodeInvite, encodeInvite, guestTrailer, tokenPageUrl } from "./invite";

describe("códigos de acesso temporário", () => {
  it("o código devolve o convite (com acentos no nome)", () => {
    const invite = {
      repo: "Knowledge-Nexus/estudo-dados",
      token: "github_pat_ABC_123",
      name: "Inês",
      until: "2026-10-20T10:00:00Z",
    };
    const code = encodeInvite(invite);
    expect(code.startsWith("KN1-")).toBe(true);
    expect(decodeInvite(`  ${code}\n`)).toEqual(invite);
  });

  it("recusa o que não é um código", () => {
    expect(decodeInvite("github_pat_ABC")).toBeNull();
    expect(decodeInvite("KN1-isto-nao-e-json")).toBeNull();
    expect(decodeInvite(encodeInvite({ repo: "sem-barra", token: "x", name: "a" }))).toBeNull();
  });

  it("a página do token vem preenchida (dono, prazo, permissões)", () => {
    const url = new URL(tokenPageUrl("Knowledge-Nexus", "estudo-dados", "Ana", 7));
    expect(url.origin + url.pathname).toBe(
      "https://github.com/settings/personal-access-tokens/new",
    );
    expect(url.searchParams.get("target_name")).toBe("Knowledge-Nexus");
    expect(url.searchParams.get("expires_in")).toBe("7");
    expect(url.searchParams.get("contents")).toBe("write");
    expect(url.searchParams.get("name")!.length).toBeLessThanOrEqual(40);
    expect(guestTrailer("Ana")).toContain("Ana");
  });
});
