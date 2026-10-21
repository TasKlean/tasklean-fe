import { afterEach, describe, expect, it, vi } from "vitest";

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

import {
  CHALLENGE_COOKIE_NAME,
  clearChallenge,
  readChallenge,
  setChallenge,
} from "@/lib/auth/two-factor-challenge/two-factor-challenge";

afterEach(() => {
  jar.clear();
});

describe("the challenge cookie", () => {
  it("reads back what was stored", async () => {
    await setChallenge("challenge-1");

    await expect(readChallenge()).resolves.toBe("challenge-1");
  });

  it("stores it under the name Proxy clears", async () => {
    await setChallenge("challenge-1");

    expect(jar.get(CHALLENGE_COOKIE_NAME)).toBe("challenge-1");
  });

  it("reports null when there is nothing to answer", async () => {
    await expect(readChallenge()).resolves.toBeNull();
  });

  it("is gone once cleared", async () => {
    await setChallenge("challenge-1");
    await clearChallenge();

    await expect(readChallenge()).resolves.toBeNull();
  });

  it("replaces an earlier challenge, since signing in again mints a new one", async () => {
    await setChallenge("challenge-1");
    await setChallenge("challenge-2");

    await expect(readChallenge()).resolves.toBe("challenge-2");
  });
});
