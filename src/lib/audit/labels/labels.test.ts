import { describe, expect, it } from "vitest";
import type { AuditEntry } from "@/lib/audit/audit.types";
import { auditSentence, entityLabel, feedCountLabel } from "@/lib/audit/labels/labels";

function entry(fields: Partial<AuditEntry> = {}): AuditEntry {
  return {
    uid: "a1",
    action: "UPDATE",
    entity: { type: "TASK", ref: "t1" },
    actor: { uid: "u1", name: "Alice", lastName: "Johnson" },
    ...fields,
  };
}

describe("auditSentence", () => {
  it("reads one action differently per entity, which is why the pair is the key", () => {
    const task = auditSentence(entry({ action: "CREATE", entity: { type: "TASK" } }));
    const group = auditSentence(entry({ action: "CREATE", entity: { type: "GROUP" } }));

    expect(task).toBe("Alice Johnson added a task");
    expect(group).toBe("Alice Johnson created this group");
  });

  it("says You on the reader's own row", () => {
    expect(auditSentence(entry(), "u1")).toBe("You updated a task");
    expect(auditSentence(entry(), "u2")).toBe("Alice Johnson updated a task");
  });

  it("names the system when the entry carried no actor", () => {
    expect(auditSentence(entry({ actor: null }))).toBe("The system updated a task");
  });

  it("names an actor the backend sent without a name", () => {
    expect(auditSentence(entry({ actor: { uid: "u9" } }))).toBe("Someone updated a task");
  });

  it("lets the backend's own sentence stand alone, rather than gluing it to a subject", () => {
    const unknown = entry({
      action: "SOMETHING_NEW",
      actionMessage: "Member removed from group",
    });

    expect(auditSentence(unknown)).toBe("Member removed from group");
  });

  it("still says something for an entry carrying neither copy nor a message", () => {
    expect(auditSentence({ uid: "a1" })).toBe("A change was made here");
  });
});

describe("entityLabel", () => {
  it("leaves the chip out rather than printing an enum at a reader", () => {
    expect(entityLabel("SOMETHING_NEW")).toBeNull();
    expect(entityLabel(undefined)).toBeNull();
  });

  it("words the types a group's trail holds", () => {
    expect(entityLabel("GROUP_MEMBER")).toBe("Member");
  });
});

describe("feedCountLabel", () => {
  it("shows progress while a page is still unread", () => {
    expect(feedCountLabel(20, 48)).toBe("20 of 48");
  });

  it("counts in words once everything is on screen", () => {
    expect(feedCountLabel(1, 1)).toBe("1 entry");
    expect(feedCountLabel(48, 48)).toBe("48 entries");
  });

  it("leaves the label out when there is nothing to count", () => {
    expect(feedCountLabel(0, 0)).toBeNull();
  });
});
