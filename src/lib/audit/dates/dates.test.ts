import { describe, expect, it } from "vitest";
import { ANY_TIME, dateChoices, rangeLabel } from "@/lib/audit/dates/dates";

const NOW = new Date("2026-11-10T08:00:00Z");

describe("dateChoices", () => {
  it("counts its windows back from today in the reader's zone", () => {
    expect(dateChoices(NOW, "Europe/Ljubljana")).toEqual([
      { label: ANY_TIME, from: "", to: "" },
      { label: "Today", from: "2026-11-10", to: "2026-11-10" },
      { label: "Last 7 days", from: "2026-11-04", to: "2026-11-10" },
      { label: "Last 30 days", from: "2026-10-12", to: "2026-11-10" },
      { label: "This month", from: "2026-11-01", to: "2026-11-10" },
    ]);
  });

  it("reads today in the zone it is given, not the runtime's", () => {
    const [, today] = dateChoices(new Date("2026-11-10T23:30:00Z"), "Pacific/Auckland");

    expect(today?.from).toBe("2026-11-11");
  });
});

describe("rangeLabel", () => {
  const choices = dateChoices(NOW, "Europe/Ljubljana");

  it("keeps a preset's own name rather than spelling its dates back", () => {
    expect(rangeLabel("2026-11-04", "2026-11-10", choices)).toBe("Last 7 days");
  });

  it("spells a range out when it is nobody's preset", () => {
    expect(rangeLabel("2026-01-05", "2026-02-09", choices)).toBe("5 Jan 2026 to 9 Feb 2026");
    expect(rangeLabel("2026-01-05", "2026-01-05", choices)).toBe("5 Jan 2026");
  });

  it("words an end that was left open", () => {
    expect(rangeLabel("2026-01-05", "", choices)).toBe("Since 5 Jan 2026");
    expect(rangeLabel("", "2026-01-05", choices)).toBe("Until 5 Jan 2026");
  });

  it("reads as the whole trail when neither end is set", () => {
    expect(rangeLabel("", "", choices)).toBe(ANY_TIME);
    expect(rangeLabel("", "", [])).toBe(ANY_TIME);
  });
});
