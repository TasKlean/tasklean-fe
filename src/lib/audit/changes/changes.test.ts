import { describe, expect, it } from "vitest";
import {
  changeFieldLabel,
  changePhrase,
  changePhrases,
  changedFieldLabels,
  changedSummary,
} from "@/lib/audit/changes/changes";

describe("changePhrase", () => {
  it("names both values when the backend kept them", () => {
    expect(changePhrase({ field: "status", from: "PENDING", to: "IN_PROGRESS" })).toBe(
      "Status changed from Pending to In progress",
    );
  });

  it("reads as a value being set when the field was empty before", () => {
    expect(changePhrase({ field: "icon", to: "broom" })).toBe("Icon set to broom");
  });

  it("reads as a value being cleared when the field is empty now", () => {
    expect(changePhrase({ field: "color", from: "#1E88E5" })).toBe("Colour cleared, was #1E88E5");
  });

  it("says only that a field changed when both values were withheld", () => {
    expect(changePhrase({ field: "description" })).toBe("Description changed");
  });

  it("treats a blank value as no value, so it cannot read as set to nothing", () => {
    expect(changePhrase({ field: "description", from: "  ", to: "" })).toBe("Description changed");
  });

  it("drops a change that names no field", () => {
    expect(changePhrase({ from: "a", to: "b" })).toBeNull();
  });
});

describe("changePhrase value kinds", () => {
  it("words a role through the one place a role is named", () => {
    expect(changePhrase({ field: "role", from: "GROUP_MEMBER", to: "GROUP_ADMIN" })).toBe(
      "Role changed from Member to Admin",
    );
  });

  it("words a role it does not know rather than reading it as a member", () => {
    expect(changePhrase({ field: "role", to: "GROUP_OWNER" })).toBe("Role set to Group owner");
  });

  it("draws a date in the reader's own zone", () => {
    const change = { field: "nextDueDate", to: "2026-03-14T23:30:00" };

    expect(changePhrase(change, "UTC")).toBe("Due date set to 14 Mar 2026");
    expect(changePhrase(change, "Pacific/Auckland")).toBe("Due date set to 15 Mar 2026");
  });

  it("leaves a date it cannot parse as it was recorded", () => {
    expect(changePhrase({ field: "nextDueDate", to: "not a date" })).toBe(
      "Due date set to not a date",
    );
  });

  it("words a flag as a yes or a no", () => {
    expect(changePhrase({ field: "requiresPhotoProof", from: "false", to: "true" })).toBe(
      "Photo proof changed from No to Yes",
    );
  });

  it("gives a duration its unit", () => {
    expect(changePhrase({ field: "estimatedTimeMinutes", from: "15", to: "30" })).toBe(
      "Estimated time changed from 15 min to 30 min",
    );
  });

  it("leaves a value that is not one of the backend's constants untouched", () => {
    expect(changePhrase({ field: "name", from: "Flat 2B", to: "Flat 3C" })).toBe(
      "Name changed from Flat 2B to Flat 3C",
    );
  });
});

describe("changeFieldLabel", () => {
  it("names a membership id after the person it points at", () => {
    expect(changeFieldLabel({ field: "assignedToId" })).toBe("Assignee");
  });

  it("words a field it has no name for rather than printing the wire spelling", () => {
    expect(changeFieldLabel({ field: "recurrenceEndDate" })).toBe("Recurrence end date");
  });
});

describe("changePhrases", () => {
  it("keeps the order the update applied and drops a change naming no field", () => {
    const phrases = changePhrases([{ field: "name" }, { to: "orphan" }, { field: "icon" }]);

    expect(phrases).toEqual(["Name changed", "Icon changed"]);
  });

  it("has nothing to say for an entry that is not a tracked update", () => {
    expect(changePhrases(undefined)).toEqual([]);
  });
});

describe("changedFieldLabels", () => {
  it("names every field without its values", () => {
    expect(changedFieldLabels([{ field: "photoUid" }, { field: "nextDueDate" }])).toEqual([
      "Picture",
      "Due date",
    ]);
  });
});

describe("changedSummary", () => {
  it("counts the fields past the first few instead of listing them", () => {
    const summary = changedSummary([
      { field: "name" },
      { field: "description" },
      { field: "color" },
      { field: "icon" },
      { field: "photoUid" },
    ]);

    expect(summary).toBe("Changed: Name, Description, Colour and 2 more");
  });

  it("lists them all when they fit", () => {
    expect(changedSummary([{ field: "name" }, { field: "icon" }])).toBe("Changed: Name, Icon");
  });

  it("says nothing for an entry that changed no fields", () => {
    expect(changedSummary(undefined)).toBeNull();
    expect(changedSummary([])).toBeNull();
  });
});
