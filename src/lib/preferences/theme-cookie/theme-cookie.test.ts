import { beforeEach, describe, expect, it, vi } from "vitest";

const { store } = vi.hoisted(() => ({ store: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      store.set(name, value);
    },
  }),
}));

import {
  readTheme,
  THEME_COOKIE_NAME,
  writeTheme,
} from "@/lib/preferences/theme-cookie/theme-cookie";

beforeEach(() => {
  store.clear();
});

describe("readTheme", () => {
  it("follows the device when nothing is cached", async () => {
    await expect(readTheme()).resolves.toBe("SYSTEM");
  });

  it("returns the cached choice", async () => {
    store.set(THEME_COOKIE_NAME, "DARK");

    await expect(readTheme()).resolves.toBe("DARK");
  });

  it("ignores a value no deploy of ours would have written", async () => {
    store.set(THEME_COOKIE_NAME, "MIDNIGHT");

    await expect(readTheme()).resolves.toBe("SYSTEM");
  });
});

describe("writeTheme", () => {
  it("caches the choice for the next render", async () => {
    await writeTheme("LIGHT");

    expect(store.get(THEME_COOKIE_NAME)).toBe("LIGHT");
    await expect(readTheme()).resolves.toBe("LIGHT");
  });
});
