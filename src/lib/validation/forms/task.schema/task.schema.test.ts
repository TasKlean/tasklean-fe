import { describe, expect, it } from "vitest";
import { echoTask, parseTask } from "@/lib/validation/forms/task.schema/task.schema";

function posted(overrides: Record<string, unknown> = {}) {
  return {
    name: "Mop the floor",
    priority: "MEDIUM",
    tagNames: [],
    ...overrides,
  };
}

describe("parseTask", () => {
  it("refuses a repeating chore with no date, which the backend answers 400 with no code", () => {
    const result = parseTask(posted({ recurrenceType: "WEEKLY" }));

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.dueDate).toBe("A chore that repeats needs a date to repeat from.");
  });

  it("allows a repeating chore that has one", () => {
    expect(parseTask(posted({ recurrenceType: "WEEKLY", dueDate: "2026-01-15" })).ok).toBe(true);
  });

  it("allows a one-off chore with no date at all", () => {
    expect(parseTask(posted()).ok).toBe(true);
  });

  it("needs a name", () => {
    const result = parseTask(posted({ name: "   " }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBe("Name this chore.");
  });

  it("takes a chore nobody gave a priority, which the backend no longer asks for", () => {
    const result = parseTask(posted({ priority: "" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.priority).toBeUndefined();
  });

  it("counts two spellings of one tag once, because the backend matches case-insensitively", () => {
    const result = parseTask(posted({ tagNames: ["Weekly", "weekly", "WEEKLY"] }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.tagNames).toEqual(["Weekly"]);
  });

  it("refuses a sixth tag", () => {
    const result = parseTask(posted({ tagNames: ["a", "b", "c", "d", "e", "f"] }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.tagNames).toBe("A chore takes 5 tags at most.");
  });

  it("treats empty minutes as none rather than as zero, which the backend refuses", () => {
    const result = parseTask(posted({ estimatedTimeMinutes: "" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.estimatedTimeMinutes).toBeUndefined();
  });

  it.each([
    ["0", "Give it at least 1 minute."],
    ["1441", "A chore cannot take more than 1440 minutes."],
    ["half an hour", "Enter the minutes as a whole number."],
  ])("refuses %j minutes", (value, message) => {
    const result = parseTask(posted({ estimatedTimeMinutes: value }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.estimatedTimeMinutes).toBe(message);
  });

  it("reads an unticked photo-proof box as off, since a checkbox posts nothing", () => {
    const result = parseTask(posted());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.requiresPhotoProof).toBe(false);
  });

  it("reads a ticked photo-proof box as on", () => {
    const result = parseTask(posted({ requiresPhotoProof: "on" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.requiresPhotoProof).toBe(true);
  });

  it.each([true, false])("takes the flag as the boolean %j a component holds", (flag) => {
    const result = parseTask(posted({ requiresPhotoProof: flag }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.requiresPhotoProof).toBe(flag);
  });

  it("reads a blank due date and time as none, which is what every field posts empty", () => {
    const result = parseTask(posted({ dueDate: "", dueTime: "" }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.dueDate).toBeUndefined();
      expect(result.values.dueTime).toBeUndefined();
    }
  });

  it.each([
    ["dueDate", "15/01/2026", "That date cannot be used."],
    ["dueTime", "9am", "That time cannot be used."],
  ])("refuses %s of %j", (field, value, message) => {
    const result = parseTask(posted({ [field]: value }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field as "dueDate" | "dueTime"]).toBe(message);
  });

  it("drops an empty category rather than sending a blank id", () => {
    const result = parseTask(posted({ categoryId: "" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.categoryId).toBeUndefined();
  });

  it("reads a picked category as its number", () => {
    const result = parseTask(posted({ categoryId: "7" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.categoryId).toBe(7);
  });
});

describe("echoTask", () => {
  it("keeps the tickbox a refused submission was posted with", () => {
    expect(echoTask(posted({ requiresPhotoProof: "on" }), []).requiresPhotoProof).toBe(true);
  });

  it("reads a tickbox nobody ticked as off, a form posting nothing for one", () => {
    expect(echoTask(posted(), []).requiresPhotoProof).toBe(false);
  });

  it("hands the tags back as the action read them, a form posting the name over again", () => {
    expect(echoTask(posted(), ["weekly", "kitchen"]).tagNames).toEqual(["weekly", "kitchen"]);
  });
});
