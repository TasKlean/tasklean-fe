import * as z from "zod/mini";
import { describe, expect, it } from "vitest";
import {
  codeRule,
  emailRule,
  optionalTwoFactorCodeRule,
  passwordRule,
  singleWordRule,
  twoFactorCodeError,
} from "@/lib/validation/rules/rules";

function check(rule: Parameters<typeof z.safeParse>[0], value: unknown): string | null {
  const result = z.safeParse(rule, value);
  return result.success ? null : (result.error.issues[0]?.message ?? null);
}

describe("emailRule", () => {
  it.each([
    "a@b.test",
    "first.last@example.com",
    "user+tag@example.co.uk",
    "UPPER@Example.COM",
    "  spaced@example.com  ",
  ])("accepts %j", (value) => {
    expect(check(emailRule, value)).toBeNull();
  });

  it.each(["", "   ", undefined, 5])("asks for an address for %j", (value) => {
    expect(check(emailRule, value)).toBe("Enter your email address.");
  });

  it.each([
    "not-an-email",
    "missing@domain",
    "@example.com",
    "user@",
    "two@@example.com",
    "spaces in@example.com",
    "user@example.c",
    "user@example..com",
    "user@.example.com",
  ])("rejects %j", (value) => {
    expect(check(emailRule, value)).toBe("Enter a valid email address.");
  });

  it("rejects an address longer than an address can be", () => {
    const value = `${"a".repeat(250)}@example.com`;

    expect(check(emailRule, value)).toBe("Enter a valid email address.");
  });
});

describe("codeRule", () => {
  it.each(["123456", "000000", "  842910  "])("accepts %j", (value) => {
    expect(check(codeRule, value)).toBeNull();
  });

  it.each(["", "   ", undefined])("asks for the code for %j", (value) => {
    expect(check(codeRule, value)).toBe("Enter the 6-digit code.");
  });

  it.each(["12345", "1234567", "12345a", "abcdef", "-12345"])("rejects %j", (value) => {
    expect(check(codeRule, value)).toBe("Enter all 6 digits.");
  });
});

describe("passwordRule", () => {
  it.each(["Chores12!", "Ab1!cdef", "Correct-Horse-Battery-Staple-2026"])("accepts %j", (value) => {
    expect(check(passwordRule, value)).toBeNull();
  });

  it.each([
    ["", "Choose a password."],
    ["Ab1!cde", "Use at least 8 characters."],
    [`Ab1!${"x".repeat(61)}`, "Use no more than 64 characters."],
    ["chores12!", "Add an uppercase letter."],
    ["CHORES12!", "Add a lowercase letter."],
    ["ChoresAb!", "Add a number."],
    ["Chores123", "Add a special character."],
    ["Password1!", "This password is too easy to guess. Try something less common."],
  ])("reports %j as %s", (value, message) => {
    expect(check(passwordRule, value)).toBe(message);
  });

  it("reports only the first unmet rule", () => {
    expect(check(passwordRule, "choresaaa")).toBe("Add an uppercase letter.");
  });

  it("does not trim, so a trailing space counts as a character", () => {
    expect(check(passwordRule, "Chores1! ")).toBeNull();
  });
});

describe("singleWordRule", () => {
  it("accepts one word and trims it", () => {
    expect(check(singleWordRule("missing"), "  Maja  ")).toBeNull();
  });

  it("rejects an internal space", () => {
    expect(check(singleWordRule("missing"), "Mary Jane")).toBe("Use one word, without spaces.");
  });

  it("uses the given message when absent", () => {
    expect(check(singleWordRule("Enter your first name."), "  ")).toBe("Enter your first name.");
  });
});

describe("optionalTwoFactorCodeRule", () => {
  it.each(["123456", "aaaa-1111", "AAAA 1111", "", "   ", undefined])("accepts %j", (value) => {
    expect(check(optionalTwoFactorCodeRule, value)).toBeNull();
  });

  it.each(["12345", "abc", "aaaa-111", "aaaa-11111"])("rejects %j", (value) => {
    expect(check(optionalTwoFactorCodeRule, value)).toBe(
      "Enter the 6 digits from your app, or a recovery code.",
    );
  });

  it("normalises a recovery code the way the backend matches it", () => {
    const result = z.safeParse(optionalTwoFactorCodeRule, " aaaa-1111 ");

    expect(result.success && result.data).toBe("AAAA1111");
  });
});

describe("twoFactorCodeError", () => {
  it.each(["123456", "aaaa-1111"])("passes %j", (value) => {
    expect(twoFactorCodeError(value)).toBeUndefined();
  });

  it("asks for the code the optional rule lets through empty", () => {
    expect(twoFactorCodeError("")).toBe("Enter your code.");
  });

  it("reports the shape a half-typed code does not have", () => {
    expect(twoFactorCodeError("123")).toBe("Enter the 6 digits from your app, or a recovery code.");
  });
});
