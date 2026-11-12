import { describe, expect, it } from "vitest";

import { buildCrumbs } from "@/components/app/chrome/group-breadcrumb/group-breadcrumb.helpers";
import type { MyGroup } from "@/lib/groups/groups.types";

const GROUPS: MyGroup[] = [
  { uid: "g1", name: "Flat 12", myRole: "GROUP_ADMIN" },
  { uid: "g2", name: "Book club", myRole: "GROUP_MEMBER" },
];

function labels(pathname: string, groups: MyGroup[] = GROUPS): string[] {
  return buildCrumbs(pathname, groups).map((crumb) => crumb.label);
}

describe("buildCrumbs", () => {
  it("gives every crumb a level of its own, which is what keys the trail", () => {
    for (const path of ["/app", "/app/groups/g1", "/app/groups/g1/settings/details"]) {
      const levels = buildCrumbs(path, GROUPS).map((crumb) => crumb.level);

      expect(new Set(levels).size).toBe(levels.length);
    }
  });

  it("is the list alone outside a group", () => {
    expect(labels("/app")).toEqual(["My Groups"]);
    expect(labels("/app/account")).toEqual(["My Groups"]);
    expect(labels("/app/groups/new")).toEqual(["My Groups"]);
  });

  it("offers the two ways in under the list, never the groups", () => {
    const [list] = buildCrumbs("/app", GROUPS);

    expect(list?.items.map((item) => item.label)).toEqual(["Create a group", "Join a group"]);
  });

  it("stops at the area on a group's own page", () => {
    expect(labels("/app/groups/g1")).toEqual(["My Groups", "Flat 12", "Tasks"]);
  });

  it("names the area and the section inside it", () => {
    expect(labels("/app/groups/g1/overview/members")).toEqual([
      "My Groups",
      "Flat 12",
      "Overview",
      "Members",
    ]);
  });

  it("lists every group under the group crumb, with the open one checked", () => {
    const [, group] = buildCrumbs("/app/groups/g2", GROUPS);
    const open = group?.items.find((item) => item.current);

    expect(open?.label).toBe("Book club");
    expect(group?.items.map((item) => item.label)).toContain("Flat 12");
  });

  it("takes an admin's settings sections from the rail", () => {
    const crumbs = buildCrumbs("/app/groups/g1/settings/invite-code", GROUPS);
    const sections = crumbs.at(-1)?.items.map((item) => item.label);

    expect(sections).toEqual([
      "Preferences",
      "Notifications",
      "Group details",
      "Invite code",
      "Delete group",
    ]);
    expect(sections).not.toContain("Back to tasks");
  });

  it("leaves a member the two settings sections that are theirs", () => {
    const crumbs = buildCrumbs("/app/groups/g2/settings/preferences", GROUPS);

    expect(crumbs.at(-1)?.items.map((item) => item.label)).toEqual([
      "Preferences",
      "Notifications",
    ]);
  });

  it("drops the fourth crumb on an area that has not redirected yet", () => {
    expect(labels("/app/groups/g1/overview")).toEqual(["My Groups", "Flat 12", "Overview"]);
  });

  it("names the open group even when the list could not be read", () => {
    expect(labels("/app/groups/g1", [])).toEqual(["My Groups", "Group", "Tasks"]);
  });
});
