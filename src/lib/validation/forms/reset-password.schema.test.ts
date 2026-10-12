import { describe, expect, it } from "vitest";
import {
  parseResetPassword,
  validateResetPassword,
} from "@/lib/validation/forms/reset-password.schema";

const GOOD = { token: "tok-1", password: "Chores12!", confirmPassword: "Chores12!" };

describe("parseResetPassword", () => {
  it("accepts a token with a policy-compliant password", () => {
    expect(parseResetPassword(GOOD)).toEqual({ ok: true, values: GOOD });
  });

  it("trims the token but never the password", () => {
    const result = parseResetPassword({
      token: "  tok-1  ",
      password: " Chores12! ",
      confirmPassword: " Chores12! ",
    });

    expect(result.ok && result.values).toEqual({
      token: "tok-1",
      password: " Chores12! ",
      confirmPassword: " Chores12! ",
    });
  });

  it("reports a missing token as its own problem", () => {
    const result = parseResetPassword({ ...GOOD, token: "" });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.token).toBe(
      "That reset link is incomplete. Ask for a new one.",
    );
  });

  it("runs the same policy as register", () => {
    const result = parseResetPassword({
      ...GOOD,
      password: "chores12!",
      confirmPassword: "chores12!",
    });

    expect(!result.ok && result.errors.password).toBe("Add an uppercase letter.");
  });

  it("reports each field's own first problem at once, as register does", () => {
    const result = parseResetPassword({
      token: "tok-1",
      password: "short",
      confirmPassword: "other",
    });

    expect(result.ok ? {} : result.errors).toEqual({
      password: "Use at least 8 characters.",
      confirmPassword: "Passwords do not match.",
    });
  });

  it("reports a mismatch once both pass on their own", () => {
    const result = parseResetPassword({ ...GOOD, confirmPassword: "Chores34!" });

    expect(!result.ok && result.errors.confirmPassword).toBe("Passwords do not match.");
  });

  it("asks for the repeat when it is empty", () => {
    const result = parseResetPassword({ ...GOOD, confirmPassword: "" });

    expect(!result.ok && result.errors.confirmPassword).toBe("Repeat your password.");
  });
});

describe("validateResetPassword", () => {
  it("reports nothing for a valid set", () => {
    expect(validateResetPassword(GOOD)).toEqual({});
  });
});
