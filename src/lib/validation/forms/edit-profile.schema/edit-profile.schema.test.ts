import { describe, expect, it } from "vitest";
import {
  echoEditProfile,
  parseEditProfile,
  validateEditProfile,
} from "@/lib/validation/forms/edit-profile.schema/edit-profile.schema";

describe("parseEditProfile", () => {
  it("trims every field, so nothing is stored with pasted whitespace around it", () => {
    expect(
      parseEditProfile({
        name: "  Ada ",
        middleName: " Byron ",
        lastName: " Lovelace  ",
        photoUid: " up-1 ",
      }),
    ).toEqual({
      ok: true,
      values: { name: "Ada", middleName: "Byron", lastName: "Lovelace", photoUid: "up-1" },
    });
  });

  it("drops a blank picture rather than posting one, which the backend answers 400 for", () => {
    expect(parseEditProfile({ name: "Ada", lastName: "Lovelace", photoUid: "" })).toEqual({
      ok: true,
      values: { name: "Ada", lastName: "Lovelace" },
    });
  });

  it("takes a save with no picture at all, which is how one is removed", () => {
    expect(parseEditProfile({ name: "Ada", lastName: "Lovelace" })).toEqual({
      ok: true,
      values: { name: "Ada", lastName: "Lovelace" },
    });
  });

  it("drops a blank middle name instead of saving an empty one", () => {
    expect(parseEditProfile({ name: "Ada", middleName: "   ", lastName: "Lovelace" })).toEqual({
      ok: true,
      values: { name: "Ada", lastName: "Lovelace" },
    });
  });

  it("asks for both names when the fields hold only spaces", () => {
    expect(parseEditProfile({ name: " ", lastName: "  " })).toEqual({
      ok: false,
      errors: { name: "Enter your first name.", lastName: "Enter your last name." },
    });
  });

  it("refuses an internal space in a first name but allows one in a surname", () => {
    expect(parseEditProfile({ name: "Mary Jane", lastName: "van Dijk" })).toEqual({
      ok: false,
      errors: { name: "Use one word, without spaces." },
    });
  });

  it("refuses a name longer than the backend's column", () => {
    expect(parseEditProfile({ name: "a".repeat(101), lastName: "Lovelace" })).toEqual({
      ok: false,
      errors: { name: "Use 100 characters or fewer." },
    });
  });

  it("refuses a uid too long to be one", () => {
    expect(
      parseEditProfile({ name: "Ada", lastName: "Lovelace", photoUid: "u".repeat(65) }),
    ).toEqual({
      ok: false,
      errors: { photoUid: "That picture cannot be used." },
    });
  });

  it("refuses a payload that is not an object", () => {
    expect(parseEditProfile("Ada").ok).toBe(false);
  });
});

describe("echoEditProfile", () => {
  it("hands back what was typed, so a rejected submit loses nothing", () => {
    expect(echoEditProfile({ name: " Ada ", middleName: "Byron", lastName: "Lovelace" })).toEqual({
      name: "Ada",
      middleName: "Byron",
      lastName: "Lovelace",
    });
  });

  it("never echoes the picture, which is nothing a reader could retype", () => {
    expect(echoEditProfile({ name: "Ada", lastName: "Lovelace", photoUid: "up-1" })).not.toContain(
      "up-1",
    );
  });

  it("answers with empty fields for a payload it cannot read", () => {
    expect(echoEditProfile(null)).toEqual({ name: "", middleName: "", lastName: "" });
  });
});

describe("validateEditProfile", () => {
  it("says nothing about a profile it would accept", () => {
    expect(validateEditProfile({ name: "Ada", lastName: "Lovelace" })).toEqual({});
  });

  it("reports the field a reader has to fix", () => {
    expect(validateEditProfile({ name: "", lastName: "Lovelace" })).toEqual({
      name: "Enter your first name.",
    });
  });
});
