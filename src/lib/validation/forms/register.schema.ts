/**
 * The register form's Zod schemas. `confirmPassword` is compared after the
 * fields pass individually, so a weak password is reported before a mismatch.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import {
  emailRule,
  optionalTextRule,
  passwordRule,
  requiredTextRule,
  singleWordRule,
} from "@/lib/validation/rules";

export const registerSchema = z
  .object({
    name: singleWordRule("Enter your first name."),
    lastName: requiredTextRule("Enter your last name."),
    middleName: optionalTextRule,
    email: emailRule,
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

// Lenient, so even a rejected submission echoes back. Never the password.
export const registerEchoSchema = z.object({
  name: optionalTextRule,
  lastName: optionalTextRule,
  middleName: optionalTextRule,
  email: optionalTextRule,
});

export type RegisterFields = z.infer<typeof registerSchema>;

export type RegisterErrors = Partial<Record<keyof RegisterFields, string>>;

export type RegisterEcho = z.infer<typeof registerEchoSchema>;

/** Parses and validates register input. */
export function parseRegister(input: unknown): Parsed<RegisterFields> {
  return parseWith(registerSchema, input);
}

/** Pulls the typed-but-rejected values back out, never the password. */
export function echoRegister(input: unknown): RegisterEcho {
  const result = z.safeParse(registerEchoSchema, input);
  return result.success ? result.data : {};
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateRegister(fields: RegisterFields): RegisterErrors {
  const result = parseRegister(fields);
  return result.ok ? {} : result.errors;
}
