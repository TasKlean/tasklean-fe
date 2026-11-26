/**
 * Which page of a task's history a press asked for. The task is bound to the
 * action on the server, so only the cursor arrives from the browser, and it is
 * the backend's own string handed back rather than anything we compose.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { cursorRule, uidRule } from "@/lib/validation/rules/rules";

export const roundPageSchema = z.object({
  taskUid: uidRule("Pick a task."),
  cursor: cursorRule,
});

export type RoundPageFields = z.infer<typeof roundPageSchema>;

/** Parses the page of a task's history a press asked for. */
export function parseRoundPage(input: unknown): Parsed<RoundPageFields> {
  return parseWith(roundPageSchema, input);
}
