import { describe, expect, it } from "vitest";
import { assignedElsewhere, canEditTask, isUnclaimed } from "@/lib/tasks/permissions/permissions";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

const MINE = "member-1";
const THEIRS = "member-2";

function task(overrides: Partial<Task> = {}): Task {
  return { uid: "task-1", createdBy: { memberUid: THEIRS }, ...overrides };
}

describe("canEditTask", () => {
  it("lets an admin tidy up after anybody", () => {
    expect(canEditTask(task(), MINE, "GROUP_ADMIN")).toBe(true);
  });

  it("lets the author change their own task", () => {
    expect(canEditTask(task({ createdBy: { memberUid: MINE } }), MINE, "GROUP_MEMBER")).toBe(true);
  });

  it("refuses a member somebody else's task", () => {
    expect(canEditTask(task(), MINE, "GROUP_MEMBER")).toBe(false);
  });

  it("refuses a member a task whose author the response did not name", () => {
    expect(canEditTask(task({ createdBy: undefined }), MINE, "GROUP_MEMBER")).toBe(false);
  });

  it("refuses a member whose own membership is unknown, rather than matching on nothing", () => {
    expect(canEditTask(task({ createdBy: undefined }), null, "GROUP_MEMBER")).toBe(false);
  });
});

describe("isUnclaimed", () => {
  it.each([undefined, {}])("counts %j as nobody holding it", (assignedTo) => {
    expect(isUnclaimed(task({ assignedTo }))).toBe(true);
  });

  it("counts a named membership as taken", () => {
    expect(isUnclaimed(task({ assignedTo: { memberUid: THEIRS } }))).toBe(false);
  });
});

describe("assignedElsewhere", () => {
  it("counts a task assigned to another member as theirs", () => {
    expect(assignedElsewhere(task({ assignedTo: { memberUid: THEIRS } }), MINE)).toBe(true);
  });

  it("counts the reader's own task as theirs to record", () => {
    expect(assignedElsewhere(task({ assignedTo: { memberUid: MINE } }), MINE)).toBe(false);
  });

  it.each([undefined, {}])("counts %j as anybody's, recording it being the claim", (assignedTo) => {
    expect(assignedElsewhere(task({ assignedTo }), MINE)).toBe(false);
  });

  it("blocks a reader whose own membership is unknown, where every assignee is somebody else", () => {
    expect(assignedElsewhere(task({ assignedTo: { memberUid: THEIRS } }), null)).toBe(true);
  });
});
