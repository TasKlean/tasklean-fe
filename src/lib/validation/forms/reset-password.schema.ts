/**
 * The reset-password form's Zod schemas. The token is checked for presence
 * only: a truncated link and a spent one are indistinguishable here, and the
 * backend answers both with the same 401.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { passwordRule } from "@/lib/validation/rules";

const MISSING_TOKEN = "That reset link is incomplete. Ask for a new one.";

export const resetPasswordSchema = z
  .object({
    token: z.string({ error: MISSING_TOKEN }).check(z.trim(), z.minLength(1, MISSING_TOKEN)),
    password: passwordRule,
    confirmPassword: z
      .string({ error: "Repeat your password." })
      .check(z.minLength(1, "Repeat your password.")),
  })
  .check(
    z.refine((fields) => fields.confirmPassword === fields.password, {
      error: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
  );

export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

export type ResetPasswordErrors = Partial<Record<keyof ResetPasswordFields, string>>;

/** Parses and validates reset-password input. */
export function parseResetPassword(input: unknown): Parsed<ResetPasswordFields> {
  return parseWith(resetPasswordSchema, input);
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateResetPassword(fields: ResetPasswordFields): ResetPasswordErrors {
  const result = parseResetPassword(fields);
  return result.ok ? {} : result.errors;
}
