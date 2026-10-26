/**
 * The change-password form. The current password is checked for presence only:
 * it may predate the policy, and the backend is the one that verifies it.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  anyPasswordRule,
  optionalTwoFactorCodeRule,
  passwordRule,
} from "@/lib/validation/rules/rules";

export const changePasswordSchema = z
  .object({
    currentPassword: anyPasswordRule,
    newPassword: passwordRule,
    confirmPassword: z
      .string({ error: "Repeat your new password." })
      .check(z.minLength(1, "Repeat your new password.")),
    code: optionalTwoFactorCodeRule,
  })
  .check(
    z.refine((fields) => fields.newPassword !== fields.currentPassword, {
      error: "Choose a password different from the current one.",
      path: ["newPassword"],
    }),
    z.refine((fields) => fields.confirmPassword === fields.newPassword, {
      error: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
  );

export type ChangePasswordFields = z.infer<typeof changePasswordSchema>;

export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordFields, string>>;

/** Parses and validates change-password input. */
export function parseChangePassword(input: unknown): Parsed<ChangePasswordFields> {
  return parseWith(changePasswordSchema, input);
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateChangePassword(fields: ChangePasswordFields): ChangePasswordErrors {
  const result = parseChangePassword(fields);
  return result.ok ? {} : result.errors;
}
