import { describe, expect, it } from "vitest";
import { recurrenceLabel } from "@/lib/tasks/recurrence/recurrence";
import { RECURRENCE_TYPES } from "@/lib/tasks/tasks/tasks.types";

describe("recurrenceLabel", () => {
  it("words every schedule the backend has", () => {
    for (const type of RECURRENCE_TYPES) {
      expect(recurrenceLabel(type)).not.toBe(type);
    }
  });

  it("words a schedule added since we mapped them", () => {
    expect(recurrenceLabel("EVERY_OTHER_WEEK")).toBe("Every other week");
  });
});
