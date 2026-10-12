import { describe, expect, it } from "vitest";
import { readEnv } from "@/lib/config/env";

const good = {
  API_BASE_URL: "http://localhost:8080",
  SESSION_SECRET: "a".repeat(32),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "client-id.apps.googleusercontent.com",
};

describe("readEnv", () => {
  it("returns the required variables when all are present", () => {
    expect(readEnv(good)).toEqual(good);
  });

  it("trims surrounding whitespace off values", () => {
    expect(readEnv({ ...good, API_BASE_URL: "  http://localhost:8080  " })).toMatchObject({
      API_BASE_URL: "http://localhost:8080",
    });
  });

  it.each(Object.keys(good))("throws when %s is missing", (key) => {
    const rest: Record<string, string> = { ...good };
    delete rest[key];
    expect(() => readEnv(rest)).toThrow(key);
  });

  it.each(["", "   "])("throws when a value is empty (%j)", (value) => {
    expect(() => readEnv({ ...good, SESSION_SECRET: value })).toThrow("SESSION_SECRET");
  });

  it("names every missing variable in one message", () => {
    expect(() => readEnv({})).toThrow(/API_BASE_URL.*SESSION_SECRET.*NEXT_PUBLIC_GOOGLE_CLIENT_ID/);
  });
});
