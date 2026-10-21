/**
 * The forgot-password form's Zod schemas. One field, but it goes through the
 * same path as every other form so the component and the action agree.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { emailRule, optionalTextRule } from "@/lib/validation/rules/rules";

export const forgotPasswordSchema = z.object({ email: emailRule });

// Lenient, so even a rejected submission echoes back.
export const forgotPasswordEchoSchema = z.object({ email: optionalTextRule });

export type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export type ForgotPasswordErrors = Partial<Record<"email", string>>;

/** Parses and validates forgot-password input. */
export function parseForgotPassword(input: unknown): Parsed<ForgotPasswordFields> {
  return parseWith(forgotPasswordSchema, input);
}

/** Pulls the rejected address back out. */
export function echoForgotPassword(input: unknown): string {
  const result = z.safeParse(forgotPasswordEchoSchema, input);
  return (result.success ? result.data.email : "") ?? "";
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateForgotPassword(fields: { email: string }): ForgotPasswordErrors {
  const result = parseForgotPassword(fields);
  return result.ok ? {} : result.errors;
}
