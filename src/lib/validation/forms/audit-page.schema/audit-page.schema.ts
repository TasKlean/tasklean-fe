/**
 * Which page of a group's trail a press asked for. A Server Action never sees
 * the route's params, and a cursor is the backend's own string handed back, so
 * both arrive from the browser and both are checked here.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  actorRefRule,
  auditFilterTypeRule,
  cursorRule,
  dayRule,
  entityRefRule,
  uidRule,
} from "@/lib/validation/rules/rules";

export const auditPageSchema = z.object({
  groupUid: uidRule("Pick a group."),
  cursor: cursorRule,
  // The filter rides along with the cursor: a cursor is a position in one
  // narrowed feed, so a page asked for without it would resume in another.
  type: auditFilterTypeRule,
  ref: entityRefRule,
  actor: actorRefRule,
  from: dayRule,
  to: dayRule,
});

export type AuditPageFields = z.infer<typeof auditPageSchema>;

/** Parses the page of a group's trail a press asked for. */
export function parseAuditPage(input: unknown): Parsed<AuditPageFields> {
  return parseWith(auditPageSchema, input);
}
