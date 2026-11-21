/**
 * Which label a button was pressed for, in which group. Both kinds share it,
 * because a category and a tag are deleted by the same two fields. The group is
 * in the form because an action never sees the route's params and has to
 * re-render the screen the press was made on.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { labelIdRule, uidRule } from "@/lib/validation/rules/rules";

export const labelActionSchema = z.object({
  groupUid: uidRule("Pick a group."),
  id: labelIdRule,
});

export type LabelActionFields = z.infer<typeof labelActionSchema>;

/** Parses the label a deletion was pressed for. */
export function parseLabelAction(input: unknown): Parsed<LabelActionFields> {
  return parseWith(labelActionSchema, input);
}
