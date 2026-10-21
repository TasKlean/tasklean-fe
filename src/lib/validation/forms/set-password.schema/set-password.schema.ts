/**
 * The set-password form, for an account that signs in with Google and has no
 * password yet. Same policy as register, with nothing current to verify.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { passwordRule } from "@/lib/validation/rules/rules";

export const setPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z
      .string({ error: "Repeat your new password." })
      .check(z.minLength(1, "Repeat your new password.")),
  })
  .check(
    z.refine((fields) => fields.confirmPassword === fields.newPassword, {
      error: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
  );

export type SetPasswordFields = z.infer<typeof setPasswordSchema>;

export type SetPasswordErrors = Partial<Record<keyof SetPasswordFields, string>>;

/** Parses and validates set-password input. */
export function parseSetPassword(input: unknown): Parsed<SetPasswordFields> {
  return parseWith(setPasswordSchema, input);
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateSetPassword(fields: SetPasswordFields): SetPasswordErrors {
  const result = parseSetPassword(fields);
  return result.ok ? {} : result.errors;
}
