/**
 * The verify-email form's Zod schemas. `resendSchema` is the same address rule
 * alone, because resending asks for no code.
 */

import * as z from "zod/mini";
import { firstErrors, parseWith, type Parsed } from "@/lib/validation/parse";
import { codeRule, emailRule } from "@/lib/validation/rules";

export const verifyEmailSchema = z.object({
  email: emailRule,
  code: codeRule,
});

export const resendSchema = z.object({ email: emailRule });

export type VerifyEmailFields = z.infer<typeof verifyEmailSchema>;

export type VerifyEmailErrors = Partial<Record<keyof VerifyEmailFields, string>>;

/** Parses and validates verification input. */
export function parseVerifyEmail(input: unknown): Parsed<VerifyEmailFields> {
  return parseWith(verifyEmailSchema, input);
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateVerifyEmail(fields: VerifyEmailFields): VerifyEmailErrors {
  const result = parseVerifyEmail(fields);
  return result.ok ? {} : result.errors;
}

/** Validates just the address, for the resend action. */
export function parseResend(
  input: unknown,
): { ok: true; email: string } | { ok: false; error: string } {
  const result = z.safeParse(resendSchema, input);
  if (result.success) return { ok: true, email: result.data.email };
  return {
    ok: false,
    error: firstErrors(result.error.issues).email ?? "Enter your email address.",
  };
}
