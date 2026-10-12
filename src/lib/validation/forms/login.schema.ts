/**
 * The login form's Zod schemas. The password is checked for presence only — a
 * policy rule here would publish it and could lock out an older password.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { anyPasswordRule, emailRule, optionalTextRule } from "@/lib/validation/rules";

export const loginSchema = z.object({
  email: emailRule,
  password: anyPasswordRule,
  next: optionalTextRule,
});

// Lenient, so even a rejected submission echoes back. Never the password.
export const loginEchoSchema = z.object({ email: optionalTextRule });

export type LoginFields = z.infer<typeof loginSchema>;

export type LoginErrors = Partial<Record<"email" | "password", string>>;

/** Parses and validates login input, typically a `FormData` object. */
export function parseLogin(input: unknown): Parsed<LoginFields> {
  return parseWith(loginSchema, input);
}

/** Pulls the rejected address back out, never the password. */
export function echoLogin(input: unknown): string {
  const result = z.safeParse(loginEchoSchema, input);
  return (result.success ? result.data.email : "") ?? "";
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateLogin(fields: { email: string; password: string }): LoginErrors {
  const result = parseLogin(fields);
  return result.ok ? {} : result.errors;
}
