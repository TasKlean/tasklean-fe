import { describe, expect, it } from "vitest";
import { dueFields, taskValues, taskWriteRequest } from "@/lib/tasks/write/write";
import { parseTask } from "@/lib/validation/forms/task.schema/task.schema";
import type { TaskFields } from "@/lib/validation/forms/task.schema/task.schema";

const ZONE = "Europe/Ljubljana";

function fields(overrides: Partial<TaskFields> = {}): TaskFields {
  return {
    name: "Mop the floor",
    description: undefined,
    priority: "MEDIUM",
    categoryId: undefined,
    tagNames: [],
    assignedToUid: undefined,
    dueDate: undefined,
    dueTime: undefined,
    recurrenceType: undefined,
    estimatedTimeMinutes: undefined,
    requiresPhotoProof: false,
    photoUid: undefined,
    ...overrides,
  };
}

describe("taskWriteRequest", () => {
  it("sends a date with no time as the end of that day where the reader is", () => {
    const body = taskWriteRequest(fields({ dueDate: "2026-01-15" }), ZONE);

    expect(body.nextDueDate).toBe("2026-01-15T22:59:00Z");
  });

  it("sends a typed time as that instant, not as the one UTC reads", () => {
    const body = taskWriteRequest(fields({ dueDate: "2026-01-15", dueTime: "09:00" }), ZONE);

    expect(body.nextDueDate).toBe("2026-01-15T08:00:00Z");
  });

  it("uses the offset in force on the day itself, not the one in force today", () => {
    const body = taskWriteRequest(fields({ dueDate: "2026-07-15", dueTime: "09:00" }), ZONE);

    expect(body.nextDueDate).toBe("2026-07-15T07:00:00Z");
  });

  it("omits the due date entirely when none was given", () => {
    expect(taskWriteRequest(fields(), ZONE).nextDueDate).toBeUndefined();
  });

  it("carries every field the task will then have, since a save replaces it", () => {
    const body = taskWriteRequest(
      fields({
        description: "Kitchen and hall",
        categoryId: 4,
        tagNames: ["weekly"],
        assignedToUid: "member-1",
        recurrenceType: "WEEKLY",
        dueDate: "2026-01-15",
        estimatedTimeMinutes: 30,
        requiresPhotoProof: true,
        photoUid: "upload-1",
      }),
      ZONE,
    );

    expect(body).toMatchObject({
      name: "Mop the floor",
      priority: "MEDIUM",
      description: "Kitchen and hall",
      categoryId: 4,
      tagNames: ["weekly"],
      assignedToUid: "member-1",
      recurrenceType: "WEEKLY",
      estimatedTimeMinutes: 30,
      requiresPhotoProof: true,
      photoUid: "upload-1",
    });
  });
});

describe("dueFields", () => {
  it("reads an instant back as the day and time where the reader is", () => {
    expect(dueFields(new Date("2026-01-15T08:00:00Z"), ZONE)).toEqual({
      date: "2026-01-15",
      time: "09:00",
    });
  });

  it("leaves the time blank for the end of a day, which nobody typed", () => {
    expect(dueFields(new Date("2026-01-15T22:59:00Z"), ZONE)).toEqual({
      date: "2026-01-15",
      time: "",
    });
  });

  it("reads a summer instant in summer time", () => {
    expect(dueFields(new Date("2026-07-15T07:00:00Z"), ZONE)).toEqual({
      date: "2026-07-15",
      time: "09:00",
    });
  });

  it("holds nothing for a task with no due date", () => {
    expect(dueFields(null, ZONE)).toEqual({ date: "", time: "" });
  });

  it("round-trips a date with no time back to a blank time", () => {
    const body = taskWriteRequest(fields({ dueDate: "2026-03-30" }), ZONE);

    expect(dueFields(new Date(body.nextDueDate ?? ""), ZONE)).toEqual({
      date: "2026-03-30",
      time: "",
    });
  });
});

describe("taskValues", () => {
  it("empties every field for a task that does not exist yet", () => {
    expect(taskValues(null, ZONE)).toEqual({
      name: "",
      description: "",
      priority: "",
      categoryId: "",
      tagNames: [],
      assignedToUid: "",
      defaultAssigneeUid: "",
      dueDate: "",
      dueTime: "",
      recurrenceType: "",
      estimatedTimeMinutes: "",
      requiresPhotoProof: false,
    });
  });

  it("fills the form from the task, in the reader's own zone", () => {
    const values = taskValues(
      {
        name: "Mop the floor",
        description: "Kitchen and hall",
        priority: "HIGH",
        categoryId: 4,
        tags: [{ id: 1, name: "weekly" }, { id: 2 }],
        assignedTo: { memberUid: "member-1" },
        defaultAssignee: { memberUid: "member-2" },
        nextDueDate: "2026-01-15T08:00:00",
        recurrenceType: "WEEKLY",
        estimatedTimeMinutes: 30,
        requiresPhotoProof: true,
      },
      ZONE,
    );

    expect(values).toEqual({
      name: "Mop the floor",
      description: "Kitchen and hall",
      priority: "HIGH",
      categoryId: "4",
      tagNames: ["weekly"],
      assignedToUid: "member-1",
      defaultAssigneeUid: "member-2",
      dueDate: "2026-01-15",
      dueTime: "09:00",
      recurrenceType: "WEEKLY",
      estimatedTimeMinutes: "30",
      requiresPhotoProof: true,
    });
  });

  it("round-trips a task through the form without moving its due date", () => {
    const stored = "2026-07-15T07:00:00";
    const values = taskValues({ name: "Water plants", nextDueDate: stored }, ZONE);
    const parsed = parseTask(values);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(taskWriteRequest(parsed.values, ZONE).nextDueDate).toBe(`${stored}Z`);
    }
  });
});
