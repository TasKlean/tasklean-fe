import { describe, expect, it } from "vitest";
import {
  asChannels,
  changedTypes,
  matrixFrom,
  type NotificationMatrix,
  toggled,
  withChannel,
} from "@/lib/notifications/settings.types";

const MATRIX: NotificationMatrix = {
  TASK_ASSIGNED: { inApp: true, email: true },
  TASK_COMPLETED: { inApp: true, email: false },
  TASK_REMINDER: { inApp: false, email: false },
  MEMBER_JOINED: { inApp: true, email: true },
};

describe("asChannels", () => {
  it("takes both booleans the entry carried", () => {
    expect(asChannels({ type: "TASK_REMINDER", inApp: false, email: true })).toEqual({
      inApp: false,
      email: true,
    });
  });

  it("falls back to the defaults for a field the response left out", () => {
    expect(asChannels({ inApp: false })).toEqual({ inApp: false, email: true });
  });

  it("falls back to the defaults for a value that is not a boolean", () => {
    expect(asChannels({ inApp: "no" } as never)).toEqual({ inApp: true, email: true });
  });

  it("falls back to the defaults for a type that was never answered", () => {
    expect(asChannels(undefined)).toEqual({ inApp: true, email: true });
  });
});

describe("toggled", () => {
  it("inverts the one channel it is given", () => {
    expect(toggled(MATRIX, "TASK_COMPLETED", "email").TASK_COMPLETED).toEqual({
      inApp: true,
      email: true,
    });
  });

  it("leaves the other channel of that type alone", () => {
    expect(toggled(MATRIX, "TASK_ASSIGNED", "inApp").TASK_ASSIGNED).toEqual({
      inApp: false,
      email: true,
    });
  });

  it("leaves every other type alone", () => {
    const next = toggled(MATRIX, "TASK_REMINDER", "inApp");

    expect(next.TASK_COMPLETED).toEqual(MATRIX.TASK_COMPLETED);
    expect(next.MEMBER_JOINED).toEqual(MATRIX.MEMBER_JOINED);
  });

  it("does not mutate the matrix it was given", () => {
    toggled(MATRIX, "MEMBER_JOINED", "email");

    expect(MATRIX.MEMBER_JOINED).toEqual({ inApp: true, email: true });
  });
});

describe("withChannel", () => {
  it("sets the channel the same way on every type", () => {
    const next = withChannel(MATRIX, "email", false);

    expect(Object.values(next).every((channels) => !channels.email)).toBe(true);
  });

  it("turns a channel on everywhere, not only where it was already on", () => {
    const next = withChannel(MATRIX, "email", true);

    expect(next.TASK_REMINDER).toEqual({ inApp: false, email: true });
  });

  it("leaves the other channel alone", () => {
    const next = withChannel(MATRIX, "email", false);

    expect(next.TASK_REMINDER.inApp).toBe(false);
    expect(next.MEMBER_JOINED.inApp).toBe(true);
  });

  it("does not mutate the matrix it was given", () => {
    withChannel(MATRIX, "inApp", false);

    expect(MATRIX.TASK_ASSIGNED).toEqual({ inApp: true, email: true });
  });
});

describe("matrixFrom", () => {
  it("turns the checked lists into a full matrix", () => {
    expect(
      matrixFrom({ inApp: ["TASK_ASSIGNED"], email: ["TASK_ASSIGNED", "TASK_REMINDER"] }),
    ).toEqual({
      TASK_ASSIGNED: { inApp: true, email: true },
      TASK_COMPLETED: { inApp: false, email: false },
      TASK_REMINDER: { inApp: false, email: true },
      MEMBER_JOINED: { inApp: false, email: false },
    });
  });

  it("reads a type missing from a list as off, which is what a box submits", () => {
    expect(matrixFrom({ inApp: [], email: [] }).MEMBER_JOINED).toEqual({
      inApp: false,
      email: false,
    });
  });

  it("ignores a name that is not a type we offer", () => {
    expect(Object.keys(matrixFrom({ inApp: ["GROUP_DELETED"], email: [] }))).toEqual([
      "TASK_ASSIGNED",
      "TASK_COMPLETED",
      "TASK_REMINDER",
      "MEMBER_JOINED",
    ]);
  });
});

describe("changedTypes", () => {
  it("names only the types whose channels differ", () => {
    expect(changedTypes(MATRIX, withChannel(MATRIX, "email", true))).toEqual([
      "TASK_COMPLETED",
      "TASK_REMINDER",
    ]);
  });

  it("names a type when either channel differs", () => {
    expect(changedTypes(MATRIX, toggled(MATRIX, "MEMBER_JOINED", "inApp"))).toEqual([
      "MEMBER_JOINED",
    ]);
  });

  it("names nothing when the two agree", () => {
    expect(changedTypes(MATRIX, { ...MATRIX })).toEqual([]);
  });
});
