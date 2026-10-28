import { describe, expect, it } from "vitest";
import { groupLabel, joinedLabel, memberCountLabel } from "@/lib/groups/labels/labels";

describe("groupLabel", () => {
  it("trims the name the backend sent", () => {
    expect(groupLabel("  Flat 12 ")).toBe("Flat 12");
  });

  it.each([undefined, "", "   "])("stands in for %j, so the link is still readable", (name) => {
    expect(groupLabel(name)).toBe("Untitled group");
  });
});

describe("memberCountLabel", () => {
  it("says member in the singular for one", () => {
    expect(memberCountLabel(1)).toBe("1 member");
  });

  it.each([0, 2, 12])("says members in the plural for %i", (count) => {
    expect(memberCountLabel(count)).toBe(`${count} members`);
  });

  it.each([undefined, -1, Number.NaN])("says nothing about %j", (count) => {
    expect(memberCountLabel(count)).toBeNull();
  });
});

describe("joinedLabel", () => {
  it("names the month and year, in a locale the container cannot change", () => {
    expect(joinedLabel("2026-07-15T12:00:00")).toBe("Joined Jul 2026");
  });

  it("takes an API timestamp that already carries a zone marker", () => {
    expect(joinedLabel("2026-11-15T12:00:00Z")).toBe("Joined Nov 2026");
  });

  it.each([undefined, "", "   "])("says nothing about %j", (value) => {
    expect(joinedLabel(value)).toBeNull();
  });
});
