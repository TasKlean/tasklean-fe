import { describe, expect, it } from "vitest";
import {
  parseJoinGroup,
  validateJoinGroup,
} from "@/lib/validation/forms/join-group.schema/join-group.schema";

describe("parseJoinGroup", () => {
  it("normalises a pasted code the way the backend stores it", () => {
    const result = parseJoinGroup({ inviteCode: "  a1b2-c3d4 " });

    expect(result).toEqual({ ok: true, values: { inviteCode: "A1B2C3D4" } });
  });

  it("asks for a code when the field was left empty", () => {
    const result = parseJoinGroup({ inviteCode: "   " });

    expect(result).toEqual({ ok: false, errors: { inviteCode: "Enter an invite code." } });
  });

  it.each(["A1B2C3", "A1B2C3D4E", "A1B2_C3D"])("refuses %s, which cannot be a code", (code) => {
    const result = parseJoinGroup({ inviteCode: code });

    expect(result).toEqual({
      ok: false,
      errors: { inviteCode: "An invite code is 8 letters and numbers." },
    });
  });

  it("asks for a code when nothing was posted at all", () => {
    expect(parseJoinGroup({}).ok).toBe(false);
  });
});

describe("validateJoinGroup", () => {
  it("reports nothing for a usable code", () => {
    expect(validateJoinGroup({ inviteCode: "A1B2C3D4" })).toEqual({});
  });
});
