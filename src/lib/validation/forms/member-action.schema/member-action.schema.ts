/**
 * Which membership a button was pressed for, and the role it was pressed to
 * set. Both arrive as hidden fields, so a tampered or missing uid is refused
 * here rather than becoming a confusing 403 from the backend.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { groupRoleRule, uidRule } from "@/lib/validation/rules/rules";

export const memberActionSchema = z.object({
  memberUid: uidRule("Pick a member."),
});

export const memberRoleSchema = z.object({
  memberUid: uidRule("Pick a member."),
  role: groupRoleRule,
});

export type MemberActionFields = z.infer<typeof memberActionSchema>;

export type MemberRoleFields = z.infer<typeof memberRoleSchema>;

/** Parses the membership a removal or a leave was pressed for. */
export function parseMemberAction(input: unknown): Parsed<MemberActionFields> {
  return parseWith(memberActionSchema, input);
}

/** Parses the membership a role change was pressed for, and the new role. */
export function parseMemberRole(input: unknown): Parsed<MemberRoleFields> {
  return parseWith(memberRoleSchema, input);
}
