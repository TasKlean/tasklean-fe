/**
 * A group's own details. One schema for two forms, because creating a group and
 * editing one post the same body: `POST /api/groups` and `PUT /api/groups/{uid}`
 * both take a `GroupRequest`.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  groupDescriptionRule,
  groupNameRule,
  optionalTextRule,
} from "@/lib/validation/rules/rules";

export const groupDetailsSchema = z.object({
  name: groupNameRule,
  description: groupDescriptionRule,
});

// Lenient, so even a rejected submission echoes back into the fields.
export const groupDetailsEchoSchema = z.object({
  name: optionalTextRule,
  description: optionalTextRule,
});

export type GroupDetailsFields = z.infer<typeof groupDetailsSchema>;

export type GroupDetailsErrors = Partial<Record<keyof GroupDetailsFields, string>>;

/** Parses the name and description a group was submitted with. */
export function parseGroupDetails(input: unknown): Parsed<GroupDetailsFields> {
  return parseWith(groupDetailsSchema, input);
}

/** Pulls the rejected details back out, so a submit without JS loses nothing. */
export function echoGroupDetails(input: unknown): GroupDetailsFields {
  const result = z.safeParse(groupDetailsEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return { name: echoed.name ?? "", description: echoed.description ?? "" };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateGroupDetails(fields: GroupDetailsFields): GroupDetailsErrors {
  const result = parseGroupDetails(fields);
  return result.ok ? {} : result.errors;
}
