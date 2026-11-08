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

describe("auditSentence with a name", () => {
  const roleChanged = entry({
    action: "ROLE_CHANGED",
    entity: { type: "GROUP_MEMBER", ref: "m2" },
  });

  it("names the member a row is about", () => {
    const named = auditSentence(roleChanged, null, { m2: { name: "Dan Novak" } });

    expect(named).toBe("Alice Johnson changed Dan Novak's role");
  });

  it("falls back to the kind for a ref no name was resolved for", () => {
    expect(auditSentence(roleChanged, null, { m9: { name: "Dan Novak" } })).toBe(
      "Alice Johnson changed a member's role",
    );
  });

  it("ignores a name for a pair that reads the same without one", () => {
    const left = entry({ action: "MEMBER_LEFT", entity: { type: "GROUP_MEMBER", ref: "m1" } });

    expect(auditSentence(left, null, { m1: { name: "Alice Johnson" } })).toBe(
      "Alice Johnson left the group",
    );
  });

  it("says somebody joined rather than added themselves", () => {
    const added = entry({
      action: "MEMBER_ADDED",
      entity: { type: "GROUP_MEMBER", ref: "m1" },
    });
    const own = { m1: { name: "Alice Johnson", userUid: "u1" } };

    expect(auditSentence(added, null, own)).toBe("Alice Johnson joined the group");
    expect(auditSentence(added, "u1", own)).toBe("You joined the group");
  });

  it("still names the member when somebody else added them", () => {
    const added = entry({
      action: "MEMBER_ADDED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
    });

    expect(auditSentence(added, null, { m2: { name: "Dan Novak", userUid: "u2" } })).toBe(
      "Alice Johnson added Dan Novak",
    );
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
