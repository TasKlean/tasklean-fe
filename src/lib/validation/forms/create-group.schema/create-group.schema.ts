/**
 * What a new group is created with. No picture: the backend will not attach one
 * to a group that does not exist yet, so the only thing to do with a file here
 * would be to hold it and hope the create succeeds.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  groupDescriptionRule,
  groupNameRule,
  optionalTextRule,
} from "@/lib/validation/rules/rules";

export const createGroupSchema = z.object({
  name: groupNameRule,
  description: groupDescriptionRule,
});

// Lenient, so even a rejected submission echoes back into the fields.
export const createGroupEchoSchema = z.object({
  name: optionalTextRule,
  description: optionalTextRule,
});

export type CreateGroupFields = z.infer<typeof createGroupSchema>;

export type CreateGroupErrors = Partial<Record<keyof CreateGroupFields, string>>;

/** Parses the name and description a group was created with. */
export function parseCreateGroup(input: unknown): Parsed<CreateGroupFields> {
  return parseWith(createGroupSchema, input);
}

/** Pulls the rejected details back out, so a submit without JS loses nothing. */
export function echoCreateGroup(input: unknown): CreateGroupFields {
  const result = z.safeParse(createGroupEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return {
    name: echoed.name ?? "",
    description: echoed.description ?? "",
  };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateCreateGroup(fields: CreateGroupFields): CreateGroupErrors {
  const result = parseCreateGroup(fields);
  return result.ok ? {} : result.errors;
}
