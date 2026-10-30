import { describe, expect, it } from "vitest";
import {
  parseMemberAction,
  parseMemberRole,
} from "@/lib/validation/forms/member-action.schema/member-action.schema";

describe("parseMemberAction", () => {
  it("takes the membership a button was pressed for", () => {
    expect(parseMemberAction({ groupUid: "g1", memberUid: "m1" })).toEqual({
      ok: true,
      values: { groupUid: "g1", memberUid: "m1" },
    });
  });

  it("refuses a missing uid rather than letting it become a path", () => {
    expect(parseMemberAction({ groupUid: "g1" })).toEqual({
      ok: false,
      errors: { memberUid: "Pick a member." },
    });
  });

  it("refuses a press that named no group", () => {
    expect(parseMemberAction({ memberUid: "m1" })).toEqual({
      ok: false,
      errors: { groupUid: "Pick a group." },
    });
  });

  it("refuses a uid too long to be one", () => {
    expect(parseMemberAction({ groupUid: "g1", memberUid: "m".repeat(65) })).toEqual({
      ok: false,
      errors: { memberUid: "Pick a member." },
    });
  });
});

describe("parseMemberRole", () => {
  it.each(["GROUP_ADMIN", "GROUP_MEMBER"])("takes %s", (role) => {
    expect(parseMemberRole({ groupUid: "g1", memberUid: "m1", role })).toEqual({
      ok: true,
      values: { groupUid: "g1", memberUid: "m1", role },
    });
  });

  it("refuses a role the backend does not have", () => {
    expect(parseMemberRole({ groupUid: "g1", memberUid: "m1", role: "OWNER" })).toEqual({
      ok: false,
      errors: { role: "Pick a role." },
    });
  });
});
