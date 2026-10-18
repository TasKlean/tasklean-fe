/**
 * The language form's only input. Refused here when it is not one of the
 * languages the backend stores, which a hand-edited select could make it.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { localeRule } from "@/lib/validation/rules";

export const languageSchema = z.object({
  locale: localeRule,
});

export type LanguageFields = z.infer<typeof languageSchema>;

/** Parses the language the form chose. */
export function parseLanguage(input: unknown): Parsed<LanguageFields> {
  return parseWith(languageSchema, input);
}
