import { describe, expect, it } from "vitest";
import { validateCode } from "@/lib/validation/code";

describe("validateCode", () => {
  it.each(["123456", "000000", "  842910  "])("accepts %j", (value) => {
    expect(validateCode(value)).toBeNull();
  });

  it.each(["", "   "])("asks for the code when given %j", (value) => {
    expect(validateCode(value)).toBe("Enter the 6-digit code.");
  });

  it.each(["12345", "1234567", "12345a", "12 456", "abcdef", "-12345"])("rejects %j", (value) => {
    expect(validateCode(value)).toBe("Enter all 6 digits.");
  });
});
