/**
 * What a search in a trail's task picker asked for. No form posts it: the panel
 * calls an action as it is typed in, so the group and the text both arrive from
 * the browser and both are checked here.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { searchRule, uidRule } from "@/lib/validation/rules/rules";

export const taskSearchSchema = z.object({
  groupUid: uidRule("Pick a group."),
  q: searchRule,
});

export type TaskSearchFields = z.infer<typeof taskSearchSchema>;

/** Parses the search a trail's task picker asked for. */
export function parseTaskSearch(input: unknown): Parsed<TaskSearchFields> {
  return parseWith(taskSearchSchema, input);
}
