import { describe, expect, it } from "vitest";
import { openGroupUid } from "@/components/app/chrome/group-switcher/open-group-uid";

describe("openGroupUid", () => {
  it("reads the uid out of a group path", () => {
    expect(openGroupUid("/app/groups/g1")).toBe("g1");
  });

  it("reads it out of a section inside the group too", () => {
    expect(openGroupUid("/app/groups/g1/members")).toBe("g1");
  });

  it("finds no group on the list itself", () => {
    expect(openGroupUid("/app")).toBeNull();
  });

  it("finds none on another signed-in screen", () => {
    expect(openGroupUid("/app/settings/devices")).toBeNull();
  });

  it("treats the create and join routes as what they are, not as groups", () => {
    expect(openGroupUid("/app/groups/new")).toBeNull();
    expect(openGroupUid("/app/groups/join")).toBeNull();
  });

  it("finds none on the bare prefix", () => {
    expect(openGroupUid("/app/groups/")).toBeNull();
  });

  it("decodes a uid the browser escaped", () => {
    expect(openGroupUid("/app/groups/a%20b")).toBe("a b");
  });

  it("finds none behind a broken escape rather than throwing", () => {
    expect(openGroupUid("/app/groups/%")).toBeNull();
  });
});
