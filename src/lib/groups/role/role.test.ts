import { describe, expect, it } from "vitest";
import { isGroupAdmin } from "@/lib/groups/role/role";

describe("isGroupAdmin", () => {
  it("recognises the admin role", () => {
    expect(isGroupAdmin("GROUP_ADMIN")).toBe(true);
  });

  it.each(["GROUP_MEMBER", "ADMIN", "group_admin", "", undefined])(
    "does not take %j for an admin",
    (role) => {
      expect(isGroupAdmin(role)).toBe(false);
    },
  );
});
