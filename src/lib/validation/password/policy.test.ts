import { describe, expect, it } from "vitest";
import {
  isGuessable,
  passwordRequirements,
  passwordRulesMet,
} from "@/lib/validation/password/policy";

describe("isGuessable", () => {
  it.each(["password", "P@ssw0rd", "Password123!", "qwerty", "aaaaaaaa", "abcdefgh", "9876543210"])(
    "flags %j",
    (value) => {
      expect(isGuessable(value)).toBe(true);
    },
  );

  it.each(["Chores12!", "Tidy-Kitchen-2026", "Correct-Horse-Battery-Staple-2026"])(
    "does not flag %j",
    (value) => {
      expect(isGuessable(value)).toBe(false);
    },
  );

  it("ignores case when matching the common list", () => {
    expect(isGuessable("PaSsWoRd123")).toBe(true);
  });
});

describe("passwordRequirements", () => {
  it("reports each rule separately", () => {
    expect(passwordRequirements("chores12")).toEqual({
      length: true,
      uppercase: false,
      lowercase: true,
      digit: true,
      special: false,
    });
  });

  it("accepts any non-alphanumeric as the special character", () => {
    for (const value of ["Chores12+", "Chores12%", "Chores12&", 'Chores12"', "Chores 12a"]) {
      expect(passwordRequirements(value).special).toBe(true);
    }
  });
});

describe("passwordRulesMet", () => {
  it.each([
    ["", 0],
    ["chores12", 3],
    ["Chores12", 4],
    ["Chores12!", 5],
  ] as const)("counts %j as %i", (value, expected) => {
    expect(passwordRulesMet(value)).toBe(expected);
  });
});
