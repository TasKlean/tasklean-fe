/**
 * Confirming an operation that weakens an active second factor: turning it off,
 * or replacing the recovery codes. Either kind of code counts here, unlike
 * enabling, and the backend spends whichever one arrives.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { twoFactorCodeRule } from "@/lib/validation/rules";

export const twoFactorConfirmSchema = z.object({
  // Never trimmed: it has to reach the backend exactly as it was typed.
  password: z.optional(z.string()),
  code: twoFactorCodeRule,
});

export type TwoFactorConfirmFields = z.infer<typeof twoFactorConfirmSchema>;

export type TwoFactorConfirmErrors = Partial<Record<"password" | "code", string>>;

/** Parses a confirmation of turning the factor off, or reissuing its codes. */
export function parseTwoFactorConfirm(input: unknown): Parsed<TwoFactorConfirmFields> {
  return parseWith(twoFactorConfirmSchema, input);
}

/** Returns a message for an invalid code, for live feedback in the form. */
export function validateTwoFactorConfirm(fields: { code: string }): TwoFactorConfirmErrors {
  const result = parseTwoFactorConfirm(fields);
  return result.ok ? {} : result.errors;
}
