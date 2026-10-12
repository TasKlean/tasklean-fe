import { describe, expect, it } from "vitest";
import {
  parseResend,
  parseVerifyEmail,
  validateVerifyEmail,
} from "@/lib/validation/forms/verify-email.schema";

describe("parseVerifyEmail", () => {
  it("trims both fields", () => {
    expect(parseVerifyEmail({ email: "  a@b.test ", code: " 123456 " })).toEqual({
      ok: true,
      values: { email: "a@b.test", code: "123456" },
    });
  });

  it("reports both fields when both are missing", () => {
    expect(parseVerifyEmail({})).toEqual({
      ok: false,
      errors: { email: "Enter your email address.", code: "Enter the 6-digit code." },
    });
  });

  it("rejects a short code", () => {
    const result = parseVerifyEmail({ email: "a@b.test", code: "123" });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.code).toBe("Enter all 6 digits.");
  });
});

describe("validateVerifyEmail", () => {
  it("returns nothing for a valid pair", () => {
    expect(validateVerifyEmail({ email: "a@b.test", code: "123456" })).toEqual({});
  });
});

describe("parseResend", () => {
  it("accepts a valid address and ignores other fields", () => {
    expect(parseResend({ email: " a@b.test ", code: "123" })).toEqual({
      ok: true,
      email: "a@b.test",
    });
  });

  it("reports a malformed address", () => {
    expect(parseResend({ email: "nope" })).toEqual({
      ok: false,
      error: "Enter a valid email address.",
    });
  });

  it("reports a missing address", () => {
    expect(parseResend({})).toEqual({ ok: false, error: "Enter your email address." });
  });
});
