import { describe, expect, it } from "vitest";
import { validateEmail } from "@/lib/validation/email";

describe("validateEmail", () => {
  it.each([
    "a@b.test",
    "first.last@example.com",
    "user+tag@example.co.uk",
    "UPPER@Example.COM",
    "  spaced@example.com  ",
  ])("accepts %j", (value) => {
    expect(validateEmail(value)).toBeNull();
  });

  it.each(["", "   "])("asks for an address when given %j", (value) => {
    expect(validateEmail(value)).toBe("Enter your email address.");
  });

  it.each([
    "not-an-email",
    "missing@domain",
    "@example.com",
    "user@",
    "two@@example.com",
    "spaces in@example.com",
    "user@example.c",
  ])("rejects %j", (value) => {
    expect(validateEmail(value)).toBe("Enter a valid email address.");
  });
});
