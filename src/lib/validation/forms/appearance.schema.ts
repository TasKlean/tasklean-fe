/**
 * The appearance form's only input: which colour scheme. It goes through a
 * schema like every other form, so a tampered or missing value is refused here
 * rather than becoming a 400 from the backend.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { themeRule } from "@/lib/validation/rules";

export const appearanceSchema = z.object({
  theme: themeRule,
});

export type AppearanceFields = z.infer<typeof appearanceSchema>;

/** Parses the theme a button was pressed for. */
export function parseAppearance(input: unknown): Parsed<AppearanceFields> {
  return parseWith(appearanceSchema, input);
}
