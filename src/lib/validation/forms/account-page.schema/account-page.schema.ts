/**
 * Which page of an account's own trail a press asked for. A Server Action is
 * reachable on its own, so the cursor and the range are checked here even
 * though the screen that sends them wrote them.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { cursorRule, dayRule } from "@/lib/validation/rules/rules";

export const accountPageSchema = z.object({
  cursor: cursorRule,
  // The range rides with the cursor: a cursor is a position in one narrowed
  // feed, so a page asked for without it would resume in another. Nothing else
  // narrows an account's history, so nothing else is taken.
  from: dayRule,
  to: dayRule,
});

export type AccountPageFields = z.infer<typeof accountPageSchema>;

/** Parses the page of an account's trail a press asked for. */
export function parseAccountPage(input: unknown): Parsed<AccountPageFields> {
  return parseWith(accountPageSchema, input);
}
