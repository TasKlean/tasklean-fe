import { describe, expect, it } from "vitest";
import {
  parseCreateGroup,
  validateCreateGroup,
} from "@/lib/validation/forms/create-group.schema/create-group.schema";

describe("parseCreateGroup", () => {
  it("trims both fields, so nothing is stored with pasted whitespace around it", () => {
    const result = parseCreateGroup({ name: "  Flat 12 ", description: " Upstairs  " });

    expect(result).toEqual({
      ok: true,
      values: { name: "Flat 12", description: "Upstairs" },
    });
  });

  it("takes a group with no description", () => {
    expect(parseCreateGroup({ name: "Flat 12" })).toEqual({
      ok: true,
      values: { name: "Flat 12" },
    });
  });

  it("keeps a picture out, since one cannot be attached before the group exists", () => {
    expect(parseCreateGroup({ name: "Flat 12", photoUid: "up-1" })).toEqual({
      ok: true,
      values: { name: "Flat 12" },
    });
  });

  it("asks for a name when the field holds only spaces", () => {
    expect(parseCreateGroup({ name: "   " })).toEqual({
      ok: false,
      errors: { name: "Enter a name for the group." },
    });
  });

  it("refuses a name past the backend's column, rather than taking a 400 for it", () => {
    expect(parseCreateGroup({ name: "a".repeat(256) })).toEqual({
      ok: false,
      errors: { name: "Use 255 characters or fewer." },
    });
  });

  it("refuses a description past the backend's column", () => {
    expect(parseCreateGroup({ name: "Flat 12", description: "a".repeat(501) })).toEqual({
      ok: false,
      errors: { description: "Use 500 characters or fewer." },
    });
  });
});

describe("validateCreateGroup", () => {
  it("reports nothing for details the backend will take", () => {
    expect(validateCreateGroup({ name: "Flat 12", description: "" })).toEqual({});
  });
});
