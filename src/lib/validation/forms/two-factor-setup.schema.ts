/**
 * Starting two-factor setup. The password is optional here because a
 * Google-only account has none to give; the backend decides whether one was
 * required and answers 401 when it was.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";

export const twoFactorSetupSchema = z.object({
  // Never trimmed: it has to reach the backend exactly as it was typed.
  password: z.optional(z.string()),
});

export type TwoFactorSetupFields = z.infer<typeof twoFactorSetupSchema>;

/** Parses a setup request. */
export function parseTwoFactorSetup(input: unknown): Parsed<TwoFactorSetupFields> {
  return parseWith(twoFactorSetupSchema, input);
}
