import { describe, expect, it } from "vitest";
import {
  parseChangePassword,
  validateChangePassword,
} from "@/lib/validation/forms/change-password.schema";

const GOOD = {
  currentPassword: "oldpass",
  newPassword: "Chores12!",
  confirmPassword: "Chores12!",
};

describe("parseChangePassword", () => {
  it("accepts a policy-compliant new password", () => {
    expect(parseChangePassword(GOOD)).toEqual({ ok: true, values: GOOD });
  });

  it("asks only for presence of the current password, which may predate the policy", () => {
    const result = parseChangePassword({ ...GOOD, currentPassword: "a" });

    expect(result.ok).toBe(true);
  });

  it("asks for the current password when it is empty", () => {
    const result = parseChangePassword({ ...GOOD, currentPassword: "" });

    expect(!result.ok && result.errors.currentPassword).toBe("Enter your password.");
  });

  it("runs the same policy as register on the new one", () => {
    const result = parseChangePassword({
      ...GOOD,
      newPassword: "chores12!",
      confirmPassword: "chores12!",
    });

    expect(!result.ok && result.errors.newPassword).toBe("Add an uppercase letter.");
  });

  it("refuses a new password that is the current one", () => {
    const result = parseChangePassword({
      currentPassword: "Chores12!",
      newPassword: "Chores12!",
      confirmPassword: "Chores12!",
    });

    expect(!result.ok && result.errors.newPassword).toBe(
      "Choose a password different from the current one.",
    );
  });

  it("reports a mismatch once the new password passes on its own", () => {
    const result = parseChangePassword({ ...GOOD, confirmPassword: "Chores34!" });

    expect(!result.ok && result.errors.confirmPassword).toBe("Passwords do not match.");
  });

  it("never trims a password", () => {
    const result = parseChangePassword({
      currentPassword: " old ",
      newPassword: " Chores12! ",
      confirmPassword: " Chores12! ",
    });

    expect(result.ok && result.values.newPassword).toBe(" Chores12! ");
    expect(result.ok && result.values.currentPassword).toBe(" old ");
  });
});

describe("validateChangePassword", () => {
  it("reports nothing for a valid set", () => {
    expect(validateChangePassword(GOOD)).toEqual({});
  });
});
