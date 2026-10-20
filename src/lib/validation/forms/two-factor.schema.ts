/**
 * The two-factor prompt. One field takes either kind of code, because the
 * backend accepts either and a mode switch would only be ours to get wrong.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { optionalTextRule, twoFactorCodeRule } from "@/lib/validation/rules";

export const twoFactorSchema = z.object({
  code: twoFactorCodeRule,
  next: optionalTextRule,
});

export type TwoFactorFields = z.infer<typeof twoFactorSchema>;

export type TwoFactorErrors = Partial<Record<"code", string>>;

/** Parses a submitted code, normalising it for the backend. */
export function parseTwoFactor(input: unknown): Parsed<TwoFactorFields> {
  return parseWith(twoFactorSchema, input);
}

/** Returns a message for an invalid code, for live feedback in the form. */
export function validateTwoFactor(fields: { code: string }): TwoFactorErrors {
  const result = parseTwoFactor(fields);
  return result.ok ? {} : result.errors;
}
