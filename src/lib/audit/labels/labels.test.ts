import { describe, expect, it } from "vitest";
import type { AuditEntry, AuditNames } from "@/lib/audit/audit.types";
import { auditLine, auditSentence, feedCountLabel } from "@/lib/audit/labels/labels";
import type { AuditToken } from "@/lib/audit/tokens/tokens";
import { tokenText } from "@/lib/audit/tokens/tokens";

const ZONE = "Europe/Ljubljana";

function says(entry: AuditEntry, viewerUid: string | null = null, names: AuditNames = {}): string {
  return tokenText(auditSentence(entry, viewerUid, names, ZONE));
}

function entry(fields: Partial<AuditEntry> = {}): AuditEntry {
  return {
    uid: "a1",
    action: "UPDATE",
    entity: { type: "TASK" },
    actor: { uid: "u1", name: "Alice", lastName: "Johnson" },
    ...fields,
  };
}

describe("auditSentence", () => {
  it("reads one action differently per entity, which is why the pair is the key", () => {
    const task = says(entry({ action: "CREATE", entity: { type: "TASK" } }));
    const group = says(entry({ action: "CREATE", entity: { type: "GROUP" } }));

    expect(task).toBe("Alice Johnson added a task");
    expect(group).toBe("Alice Johnson created this group");
  });

  it("words a round and a retirement, which the backend files against the task", () => {
    const skipped = says(entry({ action: "TASK_SKIPPED" }));
    const claimed = says(entry({ action: "TASK_CLAIMED" }));
    const archived = says(entry({ action: "TASK_ARCHIVED" }));

    expect(skipped).toBe("Alice Johnson skipped a round of a task");
    expect(claimed).toBe("Alice Johnson claimed a task");
    expect(archived).toBe("Alice Johnson archived a task");
  });

  it("says You on the reader's own row", () => {
    expect(says(entry(), "u1")).toBe("You updated a task");
    expect(says(entry(), "u2")).toBe("Alice Johnson updated a task");
  });

  it("names the system when the entry carried no actor", () => {
    expect(says(entry({ actor: null }))).toBe("The system updated a task");
  });

  it("names an actor the backend sent without a name", () => {
    expect(says(entry({ actor: { uid: "u9" } }))).toBe("Someone updated a task");
  });

  it("lets the backend's own sentence stand alone, rather than gluing it to a subject", () => {
    const unknown = entry({
      action: "SOMETHING_NEW",
      actionMessage: "Member removed from group",
    });

    expect(says(unknown)).toBe("Member removed from group");
  });

  it("still says something for an entry carrying neither copy nor a message", () => {
    expect(says({ uid: "a1" })).toBe("A change was made here");
  });
});

describe("auditSentence with a name", () => {
  const roleChanged = entry({
    action: "ROLE_CHANGED",
    entity: { type: "GROUP_MEMBER", ref: "m2" },
  });

  it("names the member a row is about", () => {
    const named = tokenText(
      auditSentence(roleChanged, null, { "GROUP_MEMBER:m2": { name: "Dan Novak" } }, ZONE),
    );

    expect(named).toBe("Alice Johnson changed Dan Novak's role");
  });

  it("falls back to the kind for a ref no name was resolved for", () => {
    expect(says(roleChanged, null, { "GROUP_MEMBER:m9": { name: "Dan Novak" } })).toBe(
      "Alice Johnson changed a member's role",
    );
  });

  it("ignores a name for a pair that reads the same without one", () => {
    const left = entry({ action: "MEMBER_LEFT", entity: { type: "GROUP_MEMBER", ref: "m1" } });

    expect(says(left, null, { "GROUP_MEMBER:m1": { name: "Alice Johnson" } })).toBe(
      "Alice Johnson left the group",
    );
  });

  it("says somebody joined rather than added themselves", () => {
    const added = entry({
      action: "MEMBER_ADDED",
      entity: { type: "GROUP_MEMBER", ref: "m1" },
    });
    const own = { "GROUP_MEMBER:m1": { name: "Alice Johnson", userUid: "u1" } };

    expect(says(added, null, own)).toBe("Alice Johnson joined the group");
    expect(says(added, "u1", own)).toBe("You joined the group");
  });

  it("still names the member when somebody else added them", () => {
    const added = entry({
      action: "MEMBER_ADDED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
    });

    expect(
      tokenText(
        auditSentence(
          added,
          null,
          { "GROUP_MEMBER:m2": { name: "Dan Novak", userUid: "u2" } },
          ZONE,
        ),
      ),
    ).toBe("Alice Johnson added Dan Novak");
  });
});

describe("auditSentence naming the thing a row is about", () => {
  const archived = entry({
    action: "TASK_ARCHIVED",
    entity: { type: "TASK", ref: "9b4f1c2e-7a10-4d6b-9f3a-2c5e8d0b1a44" },
  });

  it("names the task, the category and the tag a row is about", () => {
    const names = {
      "TASK:9b4f1c2e-7a10-4d6b-9f3a-2c5e8d0b1a44": { name: "Bins" },
      "CATEGORY:12": { name: "Kitchen" },
      "TAG:12": { name: "weekly" },
    };
    const renamed = entry({ entity: { type: "CATEGORY", ref: "12" } });
    const tagged = entry({ action: "CREATE", entity: { type: "TAG", ref: "12" } });

    expect(says(archived, null, names)).toBe("Alice Johnson archived the Bins task");
    expect(says(renamed, null, names)).toBe("Alice Johnson updated the Kitchen category");
    expect(says(tagged, null, names)).toBe("Alice Johnson added the weekly tag");
  });

  it("marks the thing's name as a name, like the actor's own", () => {
    const pieces = auditSentence(
      archived,
      null,
      {
        "TASK:9b4f1c2e-7a10-4d6b-9f3a-2c5e8d0b1a44": { name: "Bins" },
      },
      ZONE,
    );

    expect(pieces.filter((piece) => piece.emphasis === "name").map((piece) => piece.text)).toEqual([
      "Alice Johnson",
      "Bins",
    ]);
  });

  it("shortens the uid of a task nothing could name, so the row still says which one", () => {
    expect(says(archived, null, {})).toBe("Alice Johnson archived a task (9b4f1c2e...)");
  });

  it("never prints the numeric id of a category or a tag, which names nothing", () => {
    const renamed = entry({ entity: { type: "CATEGORY", ref: "12" } });

    expect(says(renamed, null, {})).toBe("Alice Johnson updated a category");
  });

  it("leaves a group row without a name, the rail naming the group already", () => {
    const updated = entry({ entity: { type: "GROUP", ref: "g1" } });

    expect(says(updated, null, { "GROUP:g1": { name: "Home" } })).toBe(
      "Alice Johnson updated the group",
    );
  });
});

describe("auditSentence naming the round an entry is about", () => {
  const BINS = { "TASK:t1": { name: "Bins" } };

  function round(action: string, dueDate = "2026-03-14T22:59") {
    return entry({
      action,
      entity: { type: "TASK", ref: "t1" },
      changedFields: [{ field: "dueDate", from: null, to: dueDate }],
    });
  }

  it("names the round in the line, for each of the four that are about one", () => {
    expect(says(round("COMPLETE"), null, BINS)).toBe(
      "Alice Johnson completed the 14 Mar 2026 round of the Bins task",
    );
    expect(says(round("TASK_SKIPPED"), null, BINS)).toBe(
      "Alice Johnson skipped the 14 Mar 2026 round of the Bins task",
    );
    expect(says(round("COMPLETION_UNDONE"), null, BINS)).toBe(
      "Alice Johnson undid the 14 Mar 2026 round of the Bins task",
    );
    expect(says(round("TASK_MISSED"), null, BINS)).toBe(
      "Alice Johnson marked the 14 Mar 2026 round of the Bins task as missed",
    );
  });

  it("draws the round in the reader's own zone, where an end-of-day round turns a day", () => {
    const line = auditSentence(round("COMPLETE"), null, BINS, "Australia/Sydney");

    expect(tokenText(line)).toContain("15 Mar 2026");
  });

  it("marks the round as a value, which is what a reader cannot press", () => {
    const pieces = auditSentence(round("COMPLETE"), null, BINS, ZONE);

    expect(pieces.filter((piece) => piece.emphasis === "value").map((piece) => piece.text)).toEqual(
      ["14 Mar 2026"],
    );
  });

  it("keeps the round out of the changes underneath, having just said it", () => {
    const line = auditLine(round("COMPLETE"), null, BINS, ZONE);

    expect(line.details).toEqual([]);
  });

  it("words a one-off, which has no round to name", () => {
    const done = entry({ action: "COMPLETE", entity: { type: "TASK", ref: "t1" } });

    expect(says(done, null, BINS)).toBe("Alice Johnson completed the Bins task");
  });

  it("names the round of a task nothing could name", () => {
    expect(says(round("TASK_SKIPPED"))).toBe(
      "Alice Johnson skipped the 14 Mar 2026 round of a task (t1)",
    );
  });

  it("reads a round a past build recorded unparseably as itself", () => {
    expect(says(round("COMPLETE", "not-a-date"), null, BINS)).toBe(
      "Alice Johnson completed the not-a-date round of the Bins task",
    );
  });

  it("ignores the field on a pair that is not about a round", () => {
    const updated = entry({
      action: "UPDATE",
      entity: { type: "TASK", ref: "t1" },
      changedFields: [{ field: "dueDate", from: null, to: "2026-03-14T22:59" }],
    });
    const line = auditLine(updated, null, BINS, ZONE);

    expect(tokenText(line.sentence)).toBe("Alice Johnson updated the Bins task");
    expect(line.details.map(tokenText)).toEqual(["Due date set to 14 Mar 2026"]);
  });
});

describe("auditSentence naming what a press can narrow the feed to", () => {
  const BINS = { "TASK:t1": { name: "Bins" } };

  function pins(line: AuditToken[]) {
    return line.flatMap((piece) => (piece.pin ? [piece.pin] : []));
  }

  it("pins the actor to themselves and the thing to itself, which are two namespaces", () => {
    const line = auditSentence(
      entry({ action: "UPDATE", entity: { type: "TASK", ref: "t1" } }),
      null,
      BINS,
      ZONE,
    );

    expect(pins(line)).toEqual([{ actor: "u1" }, { type: "task", ref: "t1" }]);
  });

  it("pins nothing to the system, which nobody can filter by", () => {
    const line = auditSentence(
      entry({ action: "TASK_MISSED", actor: undefined, entity: { type: "TASK", ref: "t1" } }),
      null,
      BINS,
      ZONE,
    );

    expect(pins(line)).toEqual([{ type: "task", ref: "t1" }]);
  });

  it("pins the reader's own row to themselves, which still reads You", () => {
    const line = auditSentence(
      entry({ action: "CREATE", entity: { type: "GROUP" } }),
      "u1",
      {},
      ZONE,
    );

    expect(tokenText(line)).toBe("You created this group");
    expect(pins(line)).toEqual([{ actor: "u1" }]);
  });

  it("pins a thing nothing could name, the uid being the whole of what is known", () => {
    const line = auditSentence(
      entry({ action: "TASK_ARCHIVED", entity: { type: "TASK", ref: "9b4f1c2e-aaaa" } }),
      null,
      {},
      ZONE,
    );

    expect(pins(line)).toEqual([{ actor: "u1" }, { type: "task", ref: "9b4f1c2e-aaaa" }]);
  });

  it("pins the member a row is about, who is not the one who acted", () => {
    const line = auditSentence(
      entry({ action: "ROLE_CHANGED", entity: { type: "GROUP_MEMBER", ref: "m2" } }),
      null,
      { "GROUP_MEMBER:m2": { name: "Dan Novak" } },
      ZONE,
    );

    expect(tokenText(line)).toBe("Alice Johnson changed Dan Novak's role");
    expect(pins(line)).toEqual([{ actor: "u1" }, { type: "member", ref: "m2" }]);
  });

  it("pins no round, a date being a fact rather than somewhere to go", () => {
    const line = auditSentence(
      entry({
        action: "COMPLETE",
        entity: { type: "TASK", ref: "t1" },
        changedFields: [{ field: "dueDate", from: null, to: "2026-03-14T22:59" }],
      }),
      null,
      BINS,
      ZONE,
    );

    expect(pins(line)).toEqual([{ actor: "u1" }, { type: "task", ref: "t1" }]);
  });
});

describe("auditSentence pieces", () => {
  it("marks whoever acted and whoever the row is about", () => {
    const roleChanged = entry({
      action: "ROLE_CHANGED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
    });

    const pieces = auditSentence(
      roleChanged,
      null,
      { "GROUP_MEMBER:m2": { name: "Dan Novak" } },
      ZONE,
    );

    expect(pieces.filter((piece) => piece.emphasis === "name").map((piece) => piece.text)).toEqual([
      "Alice Johnson",
      "Dan Novak",
    ]);
  });

  it("leaves the backend's own sentence with nothing marked, since it named nobody we resolved", () => {
    const unknown = entry({ action: "SOMETHING_NEW", actionMessage: "Member removed from group" });

    expect(auditSentence(unknown, null, {}, ZONE)).toEqual([{ text: "Member removed from group" }]);
  });
});

describe("auditSentence, on an account's own history", () => {
  function account(fields: Partial<AuditEntry> = {}): AuditEntry {
    return entry({ entity: { type: "USER", ref: "u1" }, ...fields });
  }

  it("reads as something the reader did to their own account", () => {
    expect(says(account({ action: "PASSWORD_CHANGED" }), "u1")).toBe("You changed your password");
  });

  it("names whoever else acted on the account, since it is still your history", () => {
    const line = auditSentence(
      account({ action: "ROLE_CHANGED", actor: { uid: "u9", name: "Mara", lastName: "Kos" } }),
      "u1",
      {},
      ZONE,
    );

    expect(tokenText(line)).toBe("Mara Kos changed your role");
  });

  it("keeps the backend's own sentence where it is the only copy of the detail", () => {
    const removed = account({
      action: "DEVICE_REMOVED",
      actionMessage: "Device removed: Chrome on Windows",
    });

    expect(says(removed, "u1")).toBe("Device removed: Chrome on Windows");
  });
});

describe("auditLine", () => {
  it("ends the sentence with the values where the line already names the field", () => {
    const roleChanged = entry({
      action: "ROLE_CHANGED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
      changedFields: [{ field: "role", from: "GROUP_MEMBER", to: "GROUP_ADMIN" }],
    });

    const line = auditLine(roleChanged, null, { "GROUP_MEMBER:m2": { name: "Dan Novak" } }, "UTC");

    expect(tokenText(line.sentence)).toBe(
      "Alice Johnson changed Dan Novak's role from Member to Admin",
    );
    expect(line.details).toEqual([]);
  });

  it("names the fields underneath where the line cannot carry them", () => {
    const updated = entry({
      changedFields: [{ field: "name" }, { field: "priority", from: "LOW", to: "HIGH" }],
    });

    const line = auditLine(updated, null, {}, "UTC");

    expect(tokenText(line.sentence)).toBe("Alice Johnson updated a task");
    expect(line.details.map(tokenText)).toEqual([
      "Name changed",
      "Priority changed from Low to High",
    ]);
  });

  it("keeps the detail when the field it names moved to nothing", () => {
    const roleChanged = entry({
      action: "ROLE_CHANGED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
      changedFields: [{ field: "role", from: "GROUP_ADMIN" }],
    });

    const line = auditLine(roleChanged, null, {}, "UTC");

    expect(tokenText(line.sentence)).toBe("Alice Johnson changed a member's role");
    expect(line.details.map(tokenText)).toEqual(["Role cleared, was Admin"]);
  });

  it("keeps the details when more than one field moved", () => {
    const roleChanged = entry({
      action: "ROLE_CHANGED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
      changedFields: [
        { field: "role", from: "GROUP_MEMBER", to: "GROUP_ADMIN" },
        { field: "name" },
      ],
    });

    expect(auditLine(roleChanged, null, {}, "UTC").details).toHaveLength(2);
  });

  it("says nothing extra for an entry that changed no fields", () => {
    expect(auditLine(entry({ action: "CREATE" }), null, {}, "UTC").details).toEqual([]);
  });

  it("draws a date among the values in the reader's zone", () => {
    const due = entry({
      changedFields: [{ field: "nextDueDate", to: "2026-03-14T23:30:00" }],
    });

    expect(auditLine(due, null, {}, "Pacific/Auckland").details.map(tokenText)).toEqual([
      "Due date set to 15 Mar 2026",
    ]);
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
