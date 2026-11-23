import { describe, expect, it } from "vitest";
import { sinceLabel } from "@/lib/time/since/since";

const NOW = new Date("2026-03-14T12:00:00Z");
const ZONE = "Europe/Ljubljana";

function ago(ms: number): string {
  return sinceLabel(new Date(NOW.getTime() - ms), NOW, ZONE);
}

describe("sinceLabel", () => {
  it("reads the last minute as just now", () => {
    expect(ago(30_000)).toBe("just now");
  });

  it("counts minutes, singular at one", () => {
    expect(ago(60_000)).toBe("1 minute ago");
    expect(ago(45 * 60_000)).toBe("45 minutes ago");
  });

  it("counts hours", () => {
    expect(ago(3 * 3_600_000)).toBe("3 hours ago");
  });

  it("names yesterday rather than counting it", () => {
    expect(ago(26 * 3_600_000)).toBe("yesterday");
  });

  it("counts days up to a month", () => {
    expect(ago(5 * 86_400_000)).toBe("5 days ago");
  });

  it("dates anything older, the arithmetic having stopped saying anything", () => {
    expect(ago(90 * 86_400_000)).toBe(shortOf("2025-12-14T12:00:00Z"));
  });

  it("reads a clock running ahead of the backend as just now", () => {
    expect(sinceLabel(new Date(NOW.getTime() + 20_000), NOW, ZONE)).toBe("just now");
  });
});

function shortOf(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
