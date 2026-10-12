/**
 * The Google sign-in submission. Nobody types this, so there is no per-field
 * feedback to give: either the credential arrived or the widget misfired.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { optionalTextRule, requiredTextRule } from "@/lib/validation/rules";

const MISSING_TOKEN = "Google sign-in did not complete. Please try again.";

export const googleSignInSchema = z.object({
  idToken: requiredTextRule(MISSING_TOKEN),
  next: optionalTextRule,
});

export type GoogleSignInFields = z.infer<typeof googleSignInSchema>;

/** Parses a Google sign-in submission, typically a `FormData` object. */
export function parseGoogleSignIn(input: unknown): Parsed<GoogleSignInFields> {
  return parseWith(googleSignInSchema, input);
}
