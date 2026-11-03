/**
 * What a group is saved with. Separate from creating one because of the
 * picture: `PUT /api/groups/{uid}` replaces everything it is sent, so a save
 * that leaves `photoUid` out is how a picture is taken away, and a save that
 * keeps one has to post the uid the group already holds.
 *
 * A blank `photoUid` is not the same thing. The backend's own field is bounded
 * but not required, so an empty string passes its validation and then fails the
 * lookup as a 400: the field is omitted entirely or it carries a uid.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  groupDescriptionRule,
  groupNameRule,
  optionalTextRule,
  optionalUidRule,
} from "@/lib/validation/rules/rules";

export const editGroupSchema = z.object({
  name: groupNameRule,
  description: groupDescriptionRule,
  photoUid: optionalUidRule,
});

// Lenient, so even a rejected submission echoes back into the fields.
export const editGroupEchoSchema = z.object({
  name: optionalTextRule,
  description: optionalTextRule,
});

export type EditGroupFields = z.infer<typeof editGroupSchema>;

export type EditGroupErrors = Partial<Record<keyof EditGroupFields, string>>;

export type EditGroupValues = Omit<EditGroupFields, "photoUid">;

/** Parses the details a group was saved with. */
export function parseEditGroup(input: unknown): Parsed<EditGroupFields> {
  return parseWith(editGroupSchema, input);
}

/**
 * Pulls the rejected details back out, so a submit without JS loses nothing.
 *
 * The picture is not among them: it is a hidden field the form rebuilds from
 * what is staged, and a uid is nothing a reader could retype.
 */
export function echoEditGroup(input: unknown): EditGroupValues {
  const result = z.safeParse(editGroupEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return {
    name: echoed.name ?? "",
    description: echoed.description ?? "",
  };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateEditGroup(fields: EditGroupValues): EditGroupErrors {
  const result = parseEditGroup(fields);
  return result.ok ? {} : result.errors;
}
