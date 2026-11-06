import { describe, expect, it } from "vitest";
import { exactTime, isoTime, relativeTime } from "@/lib/time/relative/relative";

const NOW = new Date("2026-11-06T12:00:00Z");

describe("relativeTime", () => {
  it("reads a timestamp ahead of us as just now, which clock skew makes ordinary", () => {
    expect(relativeTime("2026-11-06T12:00:30", NOW)).toBe("just now");
    expect(relativeTime("2026-11-06T11:59:40", NOW)).toBe("just now");
  });

  it("pluralises the unit it counts", () => {
    expect(relativeTime("2026-11-06T11:00:00", NOW)).toBe("1 hour ago");
    expect(relativeTime("2026-11-06T10:00:00", NOW)).toBe("2 hours ago");
    expect(relativeTime("2026-11-05T12:00:00", NOW)).toBe("1 day ago");
  });

  it("gives a date once the phrase would say less than one", () => {
    expect(relativeTime("2026-08-01T09:30:00", NOW)).toBe("1 Aug 2026");
  });

  it("answers null for a row with no timestamp, so a caller can leave the line out", () => {
    expect(relativeTime(undefined, NOW)).toBeNull();
  });
});

describe("exactTime", () => {
  it("draws the time in UTC and says so, since the API's own carries no zone", () => {
    expect(exactTime("2026-11-06T19:42:11")).toBe("6 Nov 2026, 19:42 UTC");
  });
});

describe("isoTime", () => {
  it("adds the zone marker the API omits", () => {
    expect(isoTime("2026-11-06T19:42:11")).toBe("2026-11-06T19:42:11.000Z");
  });
});
