import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/safe-next";

describe("safeNext", () => {
  it.each(["/", "/tasks", "/groups/abc?tab=members", "/tasks#top"])(
    "passes the in-app path %j through",
    (value) => {
      expect(safeNext(value)).toBe(value);
    },
  );

  it.each([null, undefined, "", "   "])("falls back to / for %j", (value) => {
    expect(safeNext(value)).toBe("/");
  });

  it.each([
    ["absolute http", "https://evil.test/login"],
    ["protocol-relative", "//evil.test"],
    ["protocol-relative with path", "//evil.test/steal"],
    ["backslash escape", "/\\evil.test"],
    ["scheme-ish", "javascript:alert(1)"],
    ["bare host", "evil.test"],
    ["newline smuggling", "/tasks\nLocation: https://evil.test"],
    ["tab in path", "/ta\tsks"],
  ])("rejects %s", (_label, value) => {
    expect(safeNext(value)).toBe("/");
  });
});
