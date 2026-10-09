import { describe, expect, it } from "vitest";
import { isGuessable, passwordRulesMet, validatePassword } from "@/lib/validation/password";

describe("validatePassword", () => {
  it.each(["Chores12!", "Ab1!cdef", "Tidy-Kitchen-2026x"])("accepts %j", (value) => {
    expect(validatePassword(value)).toBeNull();
  });

  it("asks for a password when empty", () => {
    expect(validatePassword("")).toBe("Choose a password.");
  });

  it("rejects under eight characters", () => {
    expect(validatePassword("Ab1!cde")).toBe("Use at least 8 characters.");
  });

  it("accepts a long passphrase now that the cap is 64", () => {
    expect(validatePassword("Correct-Horse-Battery-Staple-2026")).toBeNull();
  });

  it("rejects over sixty-four characters", () => {
    expect(validatePassword(`Ab1!${"x".repeat(61)}`)).toBe("Use no more than 64 characters.");
  });

  it.each([
    ["chores12!", "Add an uppercase letter."],
    ["CHORES12!", "Add a lowercase letter."],
    ["ChoresAb!", "Add a number."],
    ["Chores123", "Add a special character."],
  ])("names the one missing rule for %j", (value, message) => {
    expect(validatePassword(value)).toBe(message);
  });

  it("lists several missing rules", () => {
    expect(validatePassword("choresaaa")).toBe(
      "Add an uppercase letter, a number and a special character.",
    );
  });

  it.each(["Chores12~", "Chores12?", "Chores12`", "Chores12[", "Chores12'", "Chores12/"])(
    "accepts %j as a special character",
    (value) => {
      expect(validatePassword(value)).toBeNull();
    },
  );

  it.each([
    "Chores12+",
    "Chores12%",
    "Chores12&",
    "Chores12(",
    'Chores12"',
    "Chores12\\",
    "Chores 12",
  ])("accepts %j, since any non-alphanumeric counts", (value) => {
    expect(validatePassword(value)).toBeNull();
  });

  it.each(["Password1!", "P@ssw0rd1!", "Qwerty123!", "Letmein12!"])(
    "rejects the guessable %j despite it meeting every rule",
    (value) => {
      expect(validatePassword(value)).toBe(
        "This password is too easy to guess. Try something less common.",
      );
    },
  );

  it("names a missing rule before complaining about guessability", () => {
    expect(validatePassword("password123")).toBe(
      "Add an uppercase letter and a special character.",
    );
  });

  it.each(["password", "P@ssw0rd", "aaaaaaaa", "abcdefgh", "Password123!"])(
    "flags %j as guessable",
    (value) => {
      expect(isGuessable(value)).toBe(true);
    },
  );

  it.each(["Chores12!", "Tidy-Kitchen-2026"])("does not flag %j as guessable", (value) => {
    expect(isGuessable(value)).toBe(false);
  });

  it("counts rules as they are met", () => {
    expect(passwordRulesMet("")).toBe(0);
    expect(passwordRulesMet("chores12")).toBe(3);
    expect(passwordRulesMet("Chores12")).toBe(4);
    expect(passwordRulesMet("Chores12!")).toBe(5);
  });
});
