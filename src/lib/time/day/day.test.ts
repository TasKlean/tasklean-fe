import { describe, expect, it } from "vitest";
import {
  dayKey,
  dayLabel,
  dayStart,
  fullTime,
  isDayKey,
  shiftDays,
  shortDate,
  timeOfDay,
} from "@/lib/time/day/day";

describe("dayKey", () => {
  it("puts one instant on different days in different zones", () => {
    const at = new Date("2026-11-08T23:30:00Z");

    expect(dayKey(at, "UTC")).toBe("2026-11-08");
    expect(dayKey(at, "Pacific/Auckland")).toBe("2026-11-09");
    expect(dayKey(at, "America/Los_Angeles")).toBe("2026-11-08");
  });
});

describe("dayLabel", () => {
  const now = new Date("2026-11-08T12:00:00Z");

  it("names today and yesterday before spelling a date out", () => {
    expect(dayLabel(new Date("2026-11-08T01:00:00Z"), now, "UTC")).toBe("Today");
    expect(dayLabel(new Date("2026-11-07T23:00:00Z"), now, "UTC")).toBe("Yesterday");
    expect(dayLabel(new Date("2026-11-06T23:00:00Z"), now, "UTC")).toBe("6 Nov 2026");
  });

  it("counts the days in the reader's zone, not the runtime's", () => {
    // Already the 9th in Auckland while it is still the 8th in UTC, so one
    // instant is today for one reader and yesterday for the other.
    const at = new Date("2026-11-08T02:00:00Z");

    expect(dayLabel(at, now, "UTC")).toBe("Today");
    expect(dayLabel(at, now, "Pacific/Auckland")).toBe("Yesterday");
  });

  it("still finds yesterday across a clock change", () => {
    const backward = new Date("2026-10-26T00:30:00Z");
    const forward = new Date("2026-03-29T10:00:00Z");

    expect(dayLabel(new Date("2026-10-25T12:00:00Z"), backward, "Europe/Ljubljana")).toBe(
      "Yesterday",
    );
    expect(dayLabel(new Date("2026-03-28T12:00:00Z"), forward, "Europe/Ljubljana")).toBe(
      "Yesterday",
    );
  });
});

describe("timeOfDay", () => {
  it("draws the clock the reader's zone shows", () => {
    const at = new Date("2026-11-08T13:05:00Z");

    expect(timeOfDay(at, "UTC")).toBe("13:05");
    expect(timeOfDay(at, "Europe/Ljubljana")).toBe("14:05");
  });

  it("draws midnight as the start of a day, not the end of one", () => {
    expect(timeOfDay(new Date("2026-11-08T00:00:00Z"), "UTC")).toBe("00:00");
  });
});

describe("shortDate and fullTime", () => {
  it("date without a year where a column has no room for one", () => {
    expect(shortDate(new Date("2026-11-08T12:00:00Z"), "UTC")).toBe("8 Nov");
  });

  it("spells the whole thing out for a title", () => {
    expect(fullTime(new Date("2026-11-08T13:05:00Z"), "UTC")).toBe("8 Nov 2026, 13:05");
  });
});

describe("dayStart", () => {
  it("finds the instant a day begins where the reader is, at either offset", () => {
    expect(dayStart("2026-01-15", "Europe/Ljubljana").toISOString()).toBe(
      "2026-01-14T23:00:00.000Z",
    );
    expect(dayStart("2026-07-15", "Europe/Ljubljana").toISOString()).toBe(
      "2026-07-14T22:00:00.000Z",
    );
  });

  it("reads a zone behind UTC, and UTC itself", () => {
    expect(dayStart("2026-07-15", "America/New_York").toISOString()).toBe(
      "2026-07-15T04:00:00.000Z",
    );
    expect(dayStart("2026-07-15", "UTC").toISOString()).toBe("2026-07-15T00:00:00.000Z");
  });

  it("lands on the day it was asked for, on the day the clocks go forward", () => {
    expect(dayKey(dayStart("2026-03-29", "Europe/Ljubljana"), "Europe/Ljubljana")).toBe(
      "2026-03-29",
    );
    expect(dayKey(dayStart("2026-10-25", "Europe/Ljubljana"), "Europe/Ljubljana")).toBe(
      "2026-10-25",
    );
  });

  it("is dayKey backwards, in a zone that is neither the runtime's nor UTC", () => {
    expect(dayKey(dayStart("2026-07-15", "Pacific/Auckland"), "Pacific/Auckland")).toBe(
      "2026-07-15",
    );
  });
});

describe("shiftDays", () => {
  it("counts over the end of a month, a leap year and a year", () => {
    expect(shiftDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(shiftDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(shiftDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("isDayKey", () => {
  it("takes a real date and refuses one that only looks like it", () => {
    expect(isDayKey("2026-02-28")).toBe(true);
    expect(isDayKey("2026-02-31")).toBe(false);
    expect(isDayKey("2026-13-01")).toBe(false);
    expect(isDayKey("26-02-01")).toBe(false);
    expect(isDayKey("")).toBe(false);
  });
});
