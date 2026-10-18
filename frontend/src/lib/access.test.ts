import { describe, expect, it } from "vitest";
import {
  type AccessEntry,
  accessState,
  clampUntil,
  parseAccesses,
  stringifyAccesses,
  tokenFingerprint,
} from "./access";

const entry = (over: Partial<AccessEntry> = {}): AccessEntry => ({
  id: "a1b2c3d4",
  name: "Ana",
  token_sha256: "f".repeat(64),
  token_hint: "AbCd",
  token_expires: "2026-11-01T00:00:00.000Z",
  until: "2026-10-24T18:00:00.000Z",
  status: "active",
  created_at: "2026-10-17T10:00:00.000Z",
  ...over,
});
const now = Date.parse("2026-10-20T12:00:00Z");

describe("acessos temporários", () => {
  it("estado efectivo: suspenso, terminado e prazos", () => {
    expect(accessState(entry(), now)).toBe("active");
    expect(accessState(entry({ status: "paused" }), now)).toBe("paused");
    expect(accessState(entry({ status: "revoked" }), now)).toBe("revoked");
    expect(accessState(entry({ until: "2026-10-19T00:00:00Z" }), now)).toBe("ended");
    expect(accessState(entry({ token_expires: "2026-10-19T00:00:00Z" }), now)).toBe(
      "token_expired",
    );
    expect(accessState(entry({ until: null, token_expires: null }), now)).toBe("active");
  });

  it("o prazo nunca passa do fim do token", () => {
    expect(clampUntil(new Date("2026-10-30T00:00:00Z"), "2026-11-01T00:00:00Z")).toEqual({
      until: "2026-10-30T00:00:00.000Z",
      capped: false,
    });
    expect(clampUntil(new Date("2026-12-01T00:00:00Z"), "2026-11-01T00:00:00Z")).toEqual({
      until: "2026-11-01T00:00:00.000Z",
      capped: true,
    });
    expect(clampUntil(new Date("2027-01-01T00:00:00Z"), null).capped).toBe(false);
  });

  it("o registo guarda a impressão do token, nunca o token", async () => {
    const fingerprint = await tokenFingerprint(" github_pat_segredo ");
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint).toBe(await tokenFingerprint("github_pat_segredo"));
    const text = stringifyAccesses([entry({ token_sha256: fingerprint })]);
    expect(text).not.toContain("segredo");
    expect(parseAccesses(text)).toEqual([entry({ token_sha256: fingerprint })]);
    expect(parseAccesses(null)).toEqual([]);
  });
});
