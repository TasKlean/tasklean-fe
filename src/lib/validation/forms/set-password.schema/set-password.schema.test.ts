import { describe, expect, it } from "vitest";
import {
  parseSetPassword,
  validateSetPassword,
} from "@/lib/validation/forms/set-password.schema/set-password.schema";

const GOOD = { newPassword: "Chores12!", confirmPassword: "Chores12!" };

describe("parseSetPassword", () => {
  it("accepts a policy-compliant password", () => {
    expect(parseSetPassword(GOOD)).toEqual({ ok: true, values: GOOD });
  });

  it("runs the same policy as register", () => {
    const result = parseSetPassword({ newPassword: "chores12!", confirmPassword: "chores12!" });

    expect(!result.ok && result.errors.newPassword).toBe("Add an uppercase letter.");
  });

  it("reports a mismatch once the password passes on its own", () => {
    const result = parseSetPassword({ ...GOOD, confirmPassword: "Chores34!" });

    expect(!result.ok && result.errors.confirmPassword).toBe("Passwords do not match.");
  });

  it("asks for the repeat when it is empty", () => {
    const result = parseSetPassword({ ...GOOD, confirmPassword: "" });

    expect(!result.ok && result.errors.confirmPassword).toBe("Repeat your new password.");
  });
});

describe("validateSetPassword", () => {
  it("reports nothing for a valid set", () => {
    expect(validateSetPassword(GOOD)).toEqual({});
  });
});
