import { describe, expect, it } from "vitest";
import {
  InvalidApiDateError,
  parseApiDate,
  parseApiDateOrNull,
  toApiDate,
} from "@/lib/time/api-date";

describe("test timezone pin", () => {
  it("runs in the pinned non-UTC zone, so UTC bugs cannot hide", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("Europe/Ljubljana");
    expect(new Date("2026-07-01T12:00:00Z").getTimezoneOffset()).not.toBe(0);
  });
});

describe("parseApiDate", () => {
  it("reads a zone-less string as UTC, not local time", () => {
    expect(parseApiDate("2026-09-28T10:00:00").toISOString()).toBe("2026-09-28T10:00:00.000Z");
  });

  it("differs from a naive new Date() — the bug this module exists to prevent", () => {
    const api = "2026-07-01T12:00:00";
    expect(parseApiDate(api).getTime()).not.toBe(new Date(api).getTime());
  });

  it.each([
    ["2026-07-01T12:00:00", "2026-07-01T12:00:00.000Z"],
    ["2026-01-01T12:00:00", "2026-01-01T12:00:00.000Z"],
  ])("is unaffected by DST for %s", (input, expected) => {
    expect(parseApiDate(input).toISOString()).toBe(expected);
  });

  it("does not append a second marker when one is already present", () => {
    expect(parseApiDate("2026-09-28T10:00:00Z").toISOString()).toBe("2026-09-28T10:00:00.000Z");
  });

  it("respects an explicit offset rather than overriding it", () => {
    expect(parseApiDate("2026-09-28T12:00:00+02:00").toISOString()).toBe(
      "2026-09-28T10:00:00.000Z",
    );
  });

  it("handles the microsecond precision Postgres can return", () => {
    expect(parseApiDate("2026-09-28T10:00:00.123456").toISOString()).toBe(
      "2026-09-28T10:00:00.123Z",
    );
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseApiDate("  2026-09-28T10:00:00  ").toISOString()).toBe("2026-09-28T10:00:00.000Z");
  });

  it.each(["", "not a date", "2026-13-45T99:99:99"])("throws on %j", (value) => {
    expect(() => parseApiDate(value)).toThrow(InvalidApiDateError);
  });
});

describe("parseApiDateOrNull", () => {
  it.each([null, undefined, "", "   "])("returns null for %j", (value) => {
    expect(parseApiDateOrNull(value)).toBeNull();
  });

  it("parses a present value exactly as parseApiDate does", () => {
    expect(parseApiDateOrNull("2026-09-28T10:00:00")?.toISOString()).toBe(
      "2026-09-28T10:00:00.000Z",
    );
  });
});

describe("toApiDate", () => {
  it("emits UTC with no zone marker, as ISO_LOCAL_DATE_TIME requires", () => {
    expect(toApiDate(new Date("2026-09-28T10:00:00Z"))).toBe("2026-09-28T10:00:00");
  });

  it("converts a local-time Date to UTC wall time rather than echoing local", () => {
    expect(toApiDate(new Date(2026, 6, 1, 12, 0, 0))).toBe("2026-07-01T10:00:00");
  });

  it("drops sub-second precision", () => {
    expect(toApiDate(new Date("2026-09-28T10:00:00.789Z"))).toBe("2026-09-28T10:00:00");
  });

  it("throws on an invalid Date", () => {
    expect(() => toApiDate(new Date("nonsense"))).toThrow(InvalidApiDateError);
  });

  it("round-trips through parseApiDate at second precision", () => {
    const api = "2026-09-28T10:00:00";
    expect(toApiDate(parseApiDate(api))).toBe(api);
  });
});
