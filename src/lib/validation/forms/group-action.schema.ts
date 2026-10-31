/**
 * Which group a button was pressed for. A Server Action never sees the route's
 * params, so a group-scoped press posts the uid as a hidden field, and it goes
 * through a schema like every other input.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { uidRule } from "@/lib/validation/rules/rules";

export const groupActionSchema = z.object({
  groupUid: uidRule("Pick a group."),
});

export type GroupActionFields = z.infer<typeof groupActionSchema>;

/** Parses the group a rotate or a delete was pressed for. */
export function parseGroupAction(input: unknown): Parsed<GroupActionFields> {
  return parseWith(groupActionSchema, input);
}
