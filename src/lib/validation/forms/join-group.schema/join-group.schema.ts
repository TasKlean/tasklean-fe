/**
 * The join form's only input. Holding a valid code is the whole of the
 * authorization, so the shape is checked here rather than spending an attempt
 * from the tight join rate-limit bucket on something that cannot be a code.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { inviteCodeRule } from "@/lib/validation/rules/rules";

export const joinGroupSchema = z.object({
  inviteCode: inviteCodeRule,
});

export type JoinGroupFields = z.infer<typeof joinGroupSchema>;

export type JoinGroupErrors = Partial<Record<keyof JoinGroupFields, string>>;

/** Parses the code a join was submitted with. */
export function parseJoinGroup(input: unknown): Parsed<JoinGroupFields> {
  return parseWith(joinGroupSchema, input);
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateJoinGroup(fields: JoinGroupFields): JoinGroupErrors {
  const result = parseJoinGroup(fields);
  return result.ok ? {} : result.errors;
}
