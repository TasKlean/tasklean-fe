import { describe, expect, it } from "vitest";
import { createNonce, hashNonce } from "@/lib/auth/google-nonce";

describe("createNonce", () => {
  it("returns 32 bytes as lowercase hex", () => {
    expect(createNonce()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never repeats", () => {
    const minted = new Set(Array.from({ length: 100 }, createNonce));

    expect(minted.size).toBe(100);
  });
});

describe("hashNonce", () => {
  it("matches the published SHA-256 vector", async () => {
    await expect(hashNonce("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("hashes the UTF-8 bytes, not the code points", async () => {
    await expect(hashNonce("é")).resolves.toBe(
      "4a99557e4033c3539de2eb65472017cad5f9557f7a0625a09f1c3f6e2ba69c4c",
    );
  });

  it("is stable for the same input", async () => {
    const nonce = createNonce();

    expect(await hashNonce(nonce)).toBe(await hashNonce(nonce));
  });
});
