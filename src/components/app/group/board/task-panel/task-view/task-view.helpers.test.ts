import { describe, expect, it } from "vitest";
import {
  minutesLabel,
  NOT_SET,
  repeatsLabel,
} from "@/components/app/group/board/task-panel/task-view/task-view.helpers";

describe("repeatsLabel", () => {
  it("reads a one-off task as the answer to the question, not as a blank", () => {
    expect(repeatsLabel(undefined)).toBe("No");
  });

  it("words a recurrence the backend has grown since we mapped it", () => {
    expect(repeatsLabel("EVERY_OTHER_WEEK")).toBe("Every other week");
  });
});

describe("minutesLabel", () => {
  it("stays in minutes under the hour", () => {
    expect(minutesLabel(45)).toBe("45 min");
  });

  it("says one hour singular", () => {
    expect(minutesLabel(60)).toBe("1 hour");
  });

  it("carries the minutes left over", () => {
    expect(minutesLabel(150)).toBe("2 hours 30 min");
  });

  it("says so where nobody estimated it", () => {
    expect(minutesLabel(undefined)).toBe(NOT_SET);
  });
});
