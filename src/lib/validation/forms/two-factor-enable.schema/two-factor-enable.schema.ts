/**
 * Confirming a pending setup. Only a code from the app counts here: an account
 * that is not on yet has no recovery codes to fall back to.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { codeRule } from "@/lib/validation/rules/rules";

export const twoFactorEnableSchema = z.object({
  code: codeRule,
});

export type TwoFactorEnableFields = z.infer<typeof twoFactorEnableSchema>;

export type TwoFactorEnableErrors = Partial<Record<"code", string>>;

/** Parses the confirming code. */
export function parseTwoFactorEnable(input: unknown): Parsed<TwoFactorEnableFields> {
  return parseWith(twoFactorEnableSchema, input);
}

/** Returns a message for an invalid code, for live feedback in the form. */
export function validateTwoFactorEnable(fields: { code: string }): TwoFactorEnableErrors {
  const result = parseTwoFactorEnable(fields);
  return result.ok ? {} : result.errors;
}
