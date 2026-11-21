import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  taskGoneMessage,
  taskNotYoursMessage,
  taskRefusalMessage,
} from "@/lib/tasks/refusals/refusals";

describe("taskNotYoursMessage", () => {
  it("says who may change it, since Spring's own line names nothing", () => {
    expect(taskNotYoursMessage(new ApiError(403, "Access denied"))).toBe(
      "This chore is not yours to change. Its author or an admin can.",
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
  it("reports a chore somebody else removed", () => {
    expect(taskGoneMessage(new ApiError(404, "Task not found"))).toBe(
      "That chore has been removed. Refresh to see what is left.",
    );
  });

  it.each([403, 409])("passes %i to the generic line", (status) => {
    expect(taskGoneMessage(new ApiError(status, "no"))).toBeNull();
  });
});

describe("taskRefusalMessage", () => {
  it.each([
    [403, "This chore is not yours to change. Its author or an admin can."],
    [404, "That chore has been removed. Refresh to see what is left."],
  ])("phrases %i", (status, message) => {
    expect(taskRefusalMessage(new ApiError(status, "no"))).toBe(message);
  });

  it("leaves anything else to the generic line", () => {
    expect(taskRefusalMessage(new ApiError(500, "boom"))).toBeNull();
  });
});
