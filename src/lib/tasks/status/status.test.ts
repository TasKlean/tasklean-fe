import { describe, expect, it } from "vitest";
import { statusLabel } from "@/lib/tasks/status/status";

describe("statusLabel", () => {
  it("words the four states the backend sets", () => {
    expect(statusLabel("TODO")).toBe("To do");
    expect(statusLabel("COMPLETED")).toBe("Done");
    expect(statusLabel("ARCHIVED")).toBe("Retired");
  });

  it("humanises a state nothing here has words for", () => {
    expect(statusLabel("ON_HOLD")).toBe("On hold");
  });

  it("words a chore that arrived with no status", () => {
    expect(statusLabel(undefined)).toBe("Not set");
  });
});
