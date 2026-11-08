import { describe, expect, it } from "vitest";
import { asTimeZone, isTimeZone } from "@/lib/time/zone/zone";

describe("isTimeZone", () => {
  it("accepts a zone the runtime can format in", () => {
    expect(isTimeZone("Europe/Ljubljana")).toBe(true);
    expect(isTimeZone("UTC")).toBe(true);
  });

  it("refuses a zone that does not exist", () => {
    expect(isTimeZone("Mars/Olympus")).toBe(false);
  });

  it("refuses a value with no business reaching a formatter", () => {
    expect(isTimeZone("Europe/Ljubljana; drop")).toBe(false);
    expect(isTimeZone("x".repeat(65))).toBe(false);
    expect(isTimeZone("")).toBe(false);
    expect(isTimeZone(undefined)).toBe(false);
  });
});

describe("asTimeZone", () => {
  it("falls back to UTC rather than letting a formatter throw", () => {
    expect(asTimeZone("Mars/Olympus")).toBe("UTC");
    expect(asTimeZone(null)).toBe("UTC");
  });

  it("keeps a zone it knows", () => {
    expect(asTimeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
  });
});
