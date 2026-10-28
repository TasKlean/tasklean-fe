import { describe, expect, it } from "vitest";
import {
  parseGroupDetails,
  validateGroupDetails,
} from "@/lib/validation/forms/group-details.schema/group-details.schema";

describe("parseGroupDetails", () => {
  it("trims both fields, so nothing is stored with pasted whitespace around it", () => {
    const result = parseGroupDetails({ name: "  Flat 12 ", description: " Upstairs  " });

    expect(result).toEqual({
      ok: true,
      values: { name: "Flat 12", description: "Upstairs" },
    });
  });

  it("takes a group with no description", () => {
    expect(parseGroupDetails({ name: "Flat 12" })).toEqual({
      ok: true,
      values: { name: "Flat 12" },
    });
  });

  it("asks for a name when the field holds only spaces", () => {
    expect(parseGroupDetails({ name: "   " })).toEqual({
      ok: false,
      errors: { name: "Enter a name for the group." },
    });
  });

  it("refuses a name past the backend's column, rather than taking a 400 for it", () => {
    expect(parseGroupDetails({ name: "a".repeat(256) })).toEqual({
      ok: false,
      errors: { name: "Use 255 characters or fewer." },
    });
  });

  it("refuses a description past the backend's column", () => {
    expect(parseGroupDetails({ name: "Flat 12", description: "a".repeat(2001) })).toEqual({
      ok: false,
      errors: { description: "Use 2000 characters or fewer." },
    });
  });
});

describe("validateGroupDetails", () => {
  it("reports nothing for details the backend will take", () => {
    expect(validateGroupDetails({ name: "Flat 12", description: "" })).toEqual({});
  });
});
