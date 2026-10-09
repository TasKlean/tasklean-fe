import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { accessTokenExpiresWithin } from "@/lib/auth/tokens/access-token";

const key = new Uint8Array(32);

async function tokenExpiringIn(seconds: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + seconds)
    .sign(key);
}

describe("accessTokenExpiresWithin", () => {
  it("is true for a token expiring inside the skew window", async () => {
    expect(accessTokenExpiresWithin(await tokenExpiringIn(10))).toBe(true);
  });

  it("is false for a token with plenty of life left", async () => {
    expect(accessTokenExpiresWithin(await tokenExpiringIn(3600))).toBe(false);
  });

  it("is true for an already-expired token", async () => {
    expect(accessTokenExpiresWithin(await tokenExpiringIn(-60))).toBe(true);
  });

  it("honours an explicit window", async () => {
    const token = await tokenExpiringIn(120);
    expect(accessTokenExpiresWithin(token, 60)).toBe(false);
    expect(accessTokenExpiresWithin(token, 300)).toBe(true);
  });

  it("treats an unreadable token as expired — the safe direction", () => {
    expect(accessTokenExpiresWithin("not-a-jwt")).toBe(true);
  });

  it("treats a token with no exp claim as expired", async () => {
    const noExp = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).sign(key);
    expect(accessTokenExpiresWithin(noExp)).toBe(true);
  });
});
