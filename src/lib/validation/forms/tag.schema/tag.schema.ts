/**
 * What a tag is added and saved with. Same two modes as a category, one field
 * fewer, and one rule the backend applies to the body rather than the call: a
 * member may change the colour but not the name, so a member's save reposts the
 * name exactly as stored. The schema cannot enforce that, since whether the
 * reader is an admin is read per screen and never posted.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  colorRule,
  labelIdRule,
  labelNameRule,
  optionalTextRule,
  uidRule,
} from "@/lib/validation/rules/rules";

const DETAILS = {
  name: labelNameRule("Enter a name for the tag."),
  color: colorRule,
};

export const tagDetailsSchema = z.object(DETAILS);

export const createTagSchema = z.object({
  groupUid: uidRule("Pick a group."),
  ...DETAILS,
});

export const editTagSchema = z.object({
  groupUid: uidRule("Pick a group."),
  id: labelIdRule,
  ...DETAILS,
});

// Lenient, so even a rejected submission echoes back into the fields.
export const tagEchoSchema = z.object({
  name: optionalTextRule,
  color: optionalTextRule,
});

export type CreateTagFields = z.infer<typeof createTagSchema>;

export type EditTagFields = z.infer<typeof editTagSchema>;

export type TagValues = Omit<CreateTagFields, "groupUid">;

export type TagErrors = Partial<Record<keyof TagValues, string>>;

/** Parses the details a tag was added with. */
export function parseCreateTag(input: unknown): Parsed<CreateTagFields> {
  return parseWith(createTagSchema, input);
}

/** Parses the details a tag was saved with, and which one. */
export function parseEditTag(input: unknown): Parsed<EditTagFields> {
  return parseWith(editTagSchema, input);
}

/** Pulls the rejected details back out, so a submit without JS loses nothing. */
export function echoTag(input: unknown): TagValues {
  const result = z.safeParse(tagEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return { name: echoed.name ?? "", color: echoed.color ?? "" };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateTag(values: TagValues): TagErrors {
  const result = parseWith(tagDetailsSchema, values);
  return result.ok ? {} : result.errors;
}
