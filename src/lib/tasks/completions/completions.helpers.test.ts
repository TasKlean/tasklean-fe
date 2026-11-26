import { describe, expect, it } from "vitest";
import {
  canRecordRound,
  outcomeLabel,
  recordedLine,
  roundAlreadyDone,
} from "@/lib/tasks/completions/completions.helpers";
import type { TaskCompletion } from "@/lib/tasks/completions/completions.types";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

const ZONE = "Europe/Ljubljana";

// Midday, so a day either side is unambiguous in the zone above.
const NOW = new Date("2026-03-10T11:00:00Z");

describe("recordedLine", () => {
  it("names the day a repeating task comes round again", () => {
    const completion: TaskCompletion = {
      taskStatus: "TODO",
      taskNextDueDate: "2026-03-17T09:00:00",
    };

    expect(recordedLine(completion, NOW, ZONE)).toBe(
      "Marked done. It comes round again on 17 Mar.",
    );
  });

  it("says tomorrow rather than dating it", () => {
    const completion: TaskCompletion = {
      taskStatus: "TODO",
      taskNextDueDate: "2026-03-11T09:00:00",
    };

    expect(recordedLine(completion, NOW, ZONE)).toBe("Marked done. It comes round again tomorrow.");
  });

  it("says a one-off is finished, which has no next round", () => {
    const completion: TaskCompletion = { taskStatus: "COMPLETED", taskNextDueDate: undefined };

    expect(recordedLine(completion, NOW, ZONE)).toBe("Marked done. This task is finished.");
  });

  it("reads the next round in the reader's zone, not the server's", () => {
    // 23:30 UTC is already the 11th in Ljubljana, where a naive read says the
    // 10th and the line would date a task due tomorrow as due today.
    const completion: TaskCompletion = {
      taskStatus: "TODO",
      taskNextDueDate: "2026-03-10T23:30:00",
    };

    expect(recordedLine(completion, NOW, ZONE)).toBe("Marked done. It comes round again tomorrow.");
  });
});

describe("canRecordRound", () => {
  it("offers a repeating task its next round, which is back to TODO", () => {
    expect(canRecordRound({ status: "TODO", nextDueDate: "2026-03-17T09:00:00" })).toBe(true);
  });

  it("offers nothing on a one-off that is done, which stays COMPLETED", () => {
    expect(canRecordRound({ status: "COMPLETED" })).toBe(false);
  });

  it("offers nothing on an archived task", () => {
    expect(canRecordRound({ status: "ARCHIVED" })).toBe(false);
  });

  it("offers a task whose status never arrived, the press handling its own refusal", () => {
    expect(canRecordRound({})).toBe(true);
  });
});

describe("outcomeLabel", () => {
  it.each([
    ["DONE", "Done"],
    ["SKIPPED", "Skipped"],
    ["MISSED", "Missed"],
  ] as const)("words %s", (outcome, said) => {
    expect(outcomeLabel(outcome)).toBe(said);
  });

  it("reads a round with no outcome as done, which is what recording one is", () => {
    expect(outcomeLabel(undefined)).toBe("Done");
  });
});

describe("roundAlreadyDone", () => {
  const ahead: Task = { status: "TODO", nextDueDate: "2026-03-17T09:00:00" };
  const round = (dueDate: string): TaskCompletion[] => [{ id: 1, outcome: "DONE", dueDate }];

  it("names the round standing in the way of the next one", () => {
    expect(roundAlreadyDone(ahead, round("2026-03-14T09:00:00"), NOW, ZONE)).toBe("14 Mar");
  });

  it("takes a round recorded for today as still in hand", () => {
    expect(roundAlreadyDone(ahead, round("2026-03-10T22:59:00"), NOW, ZONE)).toBe("10 Mar");
  });

  it("lets the next round be recorded once that one has passed", () => {
    expect(roundAlreadyDone(ahead, round("2026-03-09T09:00:00"), NOW, ZONE)).toBeNull();
  });

  it("holds nothing back on a task that is due today", () => {
    const due: Task = { status: "TODO", nextDueDate: "2026-03-10T22:59:00" };

    expect(roundAlreadyDone(due, round("2026-03-10T22:59:00"), NOW, ZONE)).toBeNull();
  });

  it("holds nothing back on a task nobody has recorded", () => {
    expect(roundAlreadyDone(ahead, [], NOW, ZONE)).toBeNull();
  });
});
