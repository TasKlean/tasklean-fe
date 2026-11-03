import { describe, expect, it } from "vitest";
import {
  echoEditGroup,
  parseEditGroup,
  validateEditGroup,
} from "@/lib/validation/forms/edit-group.schema/edit-group.schema";

describe("parseEditGroup", () => {
  it("trims every field, so nothing is stored with pasted whitespace around it", () => {
    expect(
      parseEditGroup({ name: "  Flat 12 ", description: " Upstairs  ", photoUid: " up-1 " }),
    ).toEqual({
      ok: true,
      values: { name: "Flat 12", description: "Upstairs", photoUid: "up-1" },
    });
  });

  it("drops a blank picture rather than posting one, which the backend answers 400 for", () => {
    expect(parseEditGroup({ name: "Flat 12", photoUid: "" })).toEqual({
      ok: true,
      values: { name: "Flat 12" },
    });
    expect(parseEditGroup({ name: "Flat 12", photoUid: "   " })).toEqual({
      ok: true,
      values: { name: "Flat 12" },
    });
  });

  it("takes a save with no picture at all, which is how one is removed", () => {
    expect(parseEditGroup({ name: "Flat 12" })).toEqual({
      ok: true,
      values: { name: "Flat 12" },
    });
  });

  it("asks for a name when the field holds only spaces", () => {
    expect(parseEditGroup({ name: "   " })).toEqual({
      ok: false,
      errors: { name: "Enter a name for the group." },
    });
  });

  it("refuses a uid too long to be one", () => {
    expect(parseEditGroup({ name: "Flat 12", photoUid: "u".repeat(65) })).toEqual({
      ok: false,
      errors: { photoUid: "That picture cannot be used." },
    });
  });
});

describe("echoEditGroup", () => {
  it("echoes what was typed, and nothing that was not", () => {
    expect(echoEditGroup({ name: " Flat 12 ", photoUid: "up-1" })).toEqual({
      name: "Flat 12",
      description: "",
    });
  });
});

describe("validateEditGroup", () => {
  it("reports nothing for details the backend will take", () => {
    expect(validateEditGroup({ name: "Flat 12", description: "" })).toEqual({});
  });
});
