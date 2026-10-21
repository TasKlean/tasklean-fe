/**
 * The deactivate-account confirmation. The password is optional here because a
 * Google-only account has none to give; the backend decides whether one was
 * required and answers 401 when it was.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";

export const deactivateAccountSchema = z.object({
  // Never trimmed: it has to reach the backend exactly as it was typed.
  password: z.optional(z.string()),
});

export type DeactivateAccountFields = z.infer<typeof deactivateAccountSchema>;

/** Parses a deactivation confirmation. */
export function parseDeactivateAccount(input: unknown): Parsed<DeactivateAccountFields> {
  return parseWith(deactivateAccountSchema, input);
}
