import { describe, expect, it } from "vitest";
import { dueDigits, dueLabel, dueSpelled } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

const ZONE = "Europe/Ljubljana";
const NOW = new Date("2026-11-21T09:00:00Z");

function task(fields: Partial<Task>): Task {
  return { uid: "t1", ...fields };
}

describe("dueLabel", () => {
  it("says nothing for a task nobody put a date on", () => {
    expect(dueLabel(task({}), NOW, ZONE)).toBeNull();
  });

  it("takes the backend's own verdict rather than comparing the dates again", () => {
    const label = dueLabel(task({ nextDueDate: "2026-11-21T08:00:00", overdue: true }), NOW, ZONE);

    expect(label).toMatchObject({ text: "Overdue", tone: "overdue" });
  });

  it("names today rather than dating it", () => {
    const label = dueLabel(task({ nextDueDate: "2026-11-21T18:00:00" }), NOW, ZONE);

    expect(label).toMatchObject({ text: "Due today", tone: "soon" });
  });

  it("names tomorrow", () => {
    const label = dueLabel(task({ nextDueDate: "2026-11-22T07:00:00" }), NOW, ZONE);

    expect(label).toMatchObject({ text: "Due tomorrow", tone: "soon" });
  });

  it("dates anything further off", () => {
    const label = dueLabel(task({ nextDueDate: "2026-11-28T07:00:00" }), NOW, ZONE);

    expect(label).toMatchObject({ tone: "later" });
    expect(label?.text).toMatch(/^Due /);
  });

  it("reads 23:30 UTC on the 21st as the 22nd, the reader's day rather than the server's", () => {
    const label = dueLabel(task({ nextDueDate: "2026-11-21T23:30:00" }), NOW, ZONE);

    expect(label).toMatchObject({ text: "Due tomorrow" });
  });
});

describe("dueSpelled", () => {
  it("says nothing for a task nobody put a date on", () => {
    expect(dueSpelled(task({}), NOW, ZONE)).toBeNull();
  });

  it("names today and tomorrow, with the date behind them as the title", () => {
    expect(dueSpelled(task({ nextDueDate: "2026-11-21T17:00:00" }), NOW, ZONE)).toMatchObject({
      text: "Today",
      tone: "soon",
      title: "21 November",
    });

    expect(dueSpelled(task({ nextDueDate: "2026-11-22T07:00:00" }), NOW, ZONE)).toMatchObject({
      text: "Tomorrow",
      tone: "soon",
      title: "22 November",
    });
  });

  it("spells any other day out, keeping the wording as the title", () => {
    const spelled = dueSpelled(task({ nextDueDate: "2026-12-02T07:00:00" }), NOW, ZONE);

    expect(spelled).toMatchObject({ text: "2 December", tone: "later", title: "Due 2 Dec" });
  });

  it("keeps the date on a task that is late, which is how late it is", () => {
    const spelled = dueSpelled(
      task({ nextDueDate: "2026-11-21T08:00:00", overdue: true }),
      NOW,
      ZONE,
    );

    expect(spelled).toMatchObject({ text: "21 November", tone: "overdue", title: "Overdue" });
  });
});

describe("dueDigits", () => {
  it("says nothing for a task nobody put a date on", () => {
    expect(dueDigits(task({}), NOW, ZONE)).toBeNull();
  });

  it("dates a task in digits, keeping the wording as the title", () => {
    const digits = dueDigits(task({ nextDueDate: "2026-11-22T07:00:00" }), NOW, ZONE);

    expect(digits).toMatchObject({ text: "22/11", tone: "soon", title: "Due tomorrow" });
  });

  it("carries the tone, so the numbers alone still say a task is late", () => {
    const digits = dueDigits(
      task({ nextDueDate: "2026-11-20T08:00:00", overdue: true }),
      NOW,
      ZONE,
    );

    expect(digits).toMatchObject({ text: "20/11", tone: "overdue" });
  });

  it("reads the day the reader's own zone is on, not the server's", () => {
    const digits = dueDigits(task({ nextDueDate: "2026-11-22T23:30:00" }), NOW, "Pacific/Auckland");

    expect(digits?.text).toBe("23/11");
  });
});
