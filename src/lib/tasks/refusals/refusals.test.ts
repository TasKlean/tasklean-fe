import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  completionRefusalMessage,
  taskGoneMessage,
  taskFieldRefusal,
  taskNotYoursMessage,
  taskRefusalMessage,
} from "@/lib/tasks/refusals/refusals";

describe("taskNotYoursMessage", () => {
  it("says who may change it, since Spring's own line names nothing", () => {
    expect(taskNotYoursMessage(new ApiError(403, "Access denied"))).toBe(
      "This task is not yours to change. Its author or an admin can.",
    );
  });

  it.each([401, 404, 409, 500])("passes %i to the generic line", (status) => {
    expect(taskNotYoursMessage(new ApiError(status, "no"))).toBeNull();
  });

  it("passes anything that is not an ApiError", () => {
    expect(taskNotYoursMessage(new Error("offline"))).toBeNull();
  });
});

describe("taskGoneMessage", () => {
  it("reports a task somebody else removed", () => {
    expect(taskGoneMessage(new ApiError(404, "Task not found"))).toBe(
      "That task has been removed. Refresh to see what is left.",
    );
  });

  it.each([403, 409])("passes %i to the generic line", (status) => {
    expect(taskGoneMessage(new ApiError(status, "no"))).toBeNull();
  });

  it.each(["Assigned member not found", "Default assignee not found"])(
    "leaves %s to the field it is about, rather than saying the task is gone",
    (message) => {
      expect(taskGoneMessage(new ApiError(404, message))).toBeNull();
    },
  );
});

describe("taskFieldRefusal", () => {
  it.each([
    ["Assigned member not found", "assignedToUid"],
    ["Default assignee not found", "defaultAssigneeUid"],
  ])("blames %s on its own picker, the 404 carrying no code", (message, field) => {
    expect(taskFieldRefusal(new ApiError(404, message))).toEqual({
      [field]: "That member is not in this group any more.",
    });
  });

  it("blames a past due date on its own field, which that 400 carries a code for", () => {
    const error = new ApiError(400, "A due date cannot be in the past", null, "TASK_DUE_DATE_PAST");

    expect(taskFieldRefusal(error)).toEqual({ dueDate: "A due date cannot be in the past." });
  });

  it("passes the task's own 404, which is not about a field", () => {
    expect(taskFieldRefusal(new ApiError(404, "Task not found"))).toBeNull();
  });

  it.each([403, 409])("passes %i, which never names a picker", (status) => {
    expect(taskFieldRefusal(new ApiError(status, "Default assignee not found"))).toBeNull();
  });

  it("passes a 400 with no code, which names no field either", () => {
    expect(taskFieldRefusal(new ApiError(400, "A task that repeats needs a date"))).toBeNull();
  });
});

describe("taskRefusalMessage", () => {
  it.each([
    [403, "This task is not yours to change. Its author or an admin can."],
    [404, "That task has been removed. Refresh to see what is left."],
  ])("phrases %i", (status, message) => {
    expect(taskRefusalMessage(new ApiError(status, "no"))).toBe(message);
  });

  it("leaves anything else to the generic line", () => {
    expect(taskRefusalMessage(new ApiError(500, "boom"))).toBeNull();
  });
});

describe("completionRefusalMessage", () => {
  it("says a round nobody could have missed yet is not due, which is only ever a skip", () => {
    const error = new ApiError(409, "This task is not due yet", null, "TASK_ROUND_NOT_DUE");

    expect(completionRefusalMessage(error)).toBe(
      "Not due yet. You can record this on the day it is due.",
    );
  });

  it("says a task has already been run ahead, which is the double tap", () => {
    const error = new ApiError(409, "done ahead", null, "TASK_ROUND_ALREADY_AHEAD");

    expect(completionRefusalMessage(error)).toBe(
      "This task has already been done ahead of schedule. The next round can be recorded once this one is over.",
    );
  });

  it.each([
    ["TASK_INSTANCE_ALREADY_RECORDED", "already recorded"],
    ["TASK_PHOTO_PROOF_REQUIRED", "needs a photo"],
    ["TASK_ARCHIVED", "archived"],
  ])("phrases %s", (code, says) => {
    expect(completionRefusalMessage(new ApiError(409, "no", null, code))).toContain(says);
  });

  it("says a 403 is somebody else's task, not one you may not change", () => {
    expect(completionRefusalMessage(new ApiError(403, "Access denied"))).toBe(
      "This task is assigned to somebody else.",
    );
  });

  it("passes a 409 carrying a code nothing here knows", () => {
    expect(
      completionRefusalMessage(new ApiError(409, "no", null, "TASK_SOMETHING_NEW")),
    ).toBeNull();
  });

  it("reports a task that is gone, which a press can still run into", () => {
    expect(completionRefusalMessage(new ApiError(404, "Task not found"))).toContain("removed");
  });
});
