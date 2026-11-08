import { describe, expect, it } from "vitest";
import type { AuditEntry } from "@/lib/audit/audit.types";
import { auditDays } from "@/lib/audit/days/days";

const NOW = new Date("2026-11-08T12:00:00Z");

function entry(uid: string, dateCreated?: string): AuditEntry {
  return { uid, action: "UPDATE", entity: { type: "TASK" }, dateCreated };
}

describe("auditDays", () => {
  it("cuts a feed into the days its rows fall on, newest first", () => {
    const days = auditDays(
      [
        entry("a1", "2026-11-08T09:00:00"),
        entry("a2", "2026-11-08T08:00:00"),
        entry("a3", "2026-11-07T22:00:00"),
        entry("a4", "2026-11-02T10:00:00"),
      ],
      NOW,
      "UTC",
    );

    expect(days.map((day) => day.label)).toEqual(["Today", "Yesterday", "2 Nov 2026"]);
    expect(days[0].rows.map((row) => row.entry.uid)).toEqual(["a1", "a2"]);
    expect(days[1].rows).toHaveLength(1);
  });

  it("cuts them where the reader's own zone cuts them", () => {
    const entries = [entry("a1", "2026-11-07T23:30:00"), entry("a2", "2026-11-07T22:30:00")];

    expect(auditDays(entries, NOW, "UTC")).toHaveLength(1);
    // The pair straddles midnight in Ljubljana, where one is already the 8th.
    expect(auditDays(entries, NOW, "Europe/Ljubljana")).toHaveLength(2);
  });

  it("parses each row's instant once, for the row to draw", () => {
    const [day] = auditDays([entry("a1", "2026-11-08T09:00:00")], NOW, "UTC");

    expect(day.rows[0].at?.toISOString()).toBe("2026-11-08T09:00:00.000Z");
  });

  it("keeps a row the backend sent no timestamp with under the day above it", () => {
    const days = auditDays([entry("a1", "2026-11-08T09:00:00"), entry("a2")], NOW, "UTC");

    expect(days).toHaveLength(1);
    expect(days[0].rows.map((row) => row.entry.uid)).toEqual(["a1", "a2"]);
    expect(days[0].rows[1].at).toBeNull();
  });

  it("has no sections for a feed with no rows", () => {
    expect(auditDays([], NOW, "UTC")).toEqual([]);
  });
});
