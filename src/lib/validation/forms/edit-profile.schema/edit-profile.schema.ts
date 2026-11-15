/**
 * What a profile is saved with. `PUT /api/users/{uid}` replaces everything it
 * is sent, so a save that leaves `photoUid` out is how a picture is taken away,
 * and a save that keeps one has to post the uid the account already holds.
 *
 * A blank `photoUid` is not the same thing. The backend's field is bounded but
 * not required, so an empty string passes its validation and then fails the
 * lookup behind it: the field is omitted entirely or it carries a uid.
 *
 * No email here. Changing the sign-in address is a credential change rather
 * than a profile edit, and the endpoint accepts no such field.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  firstNameRule,
  lastNameRule,
  middleNameRule,
  optionalTextRule,
  optionalUidRule,
} from "@/lib/validation/rules/rules";

export const editProfileSchema = z.object({
  name: firstNameRule("Enter your first name."),
  middleName: middleNameRule,
  lastName: lastNameRule("Enter your last name."),
  photoUid: optionalUidRule,
});

// Lenient, so even a rejected submission echoes back into the fields.
export const editProfileEchoSchema = z.object({
  name: optionalTextRule,
  middleName: optionalTextRule,
  lastName: optionalTextRule,
});

export type EditProfileFields = z.infer<typeof editProfileSchema>;

export type EditProfileErrors = Partial<Record<keyof EditProfileFields, string>>;

export type EditProfileValues = Omit<EditProfileFields, "photoUid">;

/** Parses the profile a save was posted with. */
export function parseEditProfile(input: unknown): Parsed<EditProfileFields> {
  return parseWith(editProfileSchema, input);
}

/**
 * Pulls the rejected names back out, so a submit without JS loses nothing.
 *
 * The picture is not among them: it is a hidden field the form rebuilds from
 * what is staged, and a uid is nothing a reader could retype.
 */
export function echoEditProfile(input: unknown): EditProfileValues {
  const result = z.safeParse(editProfileEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return {
    name: echoed.name ?? "",
    middleName: echoed.middleName ?? "",
    lastName: echoed.lastName ?? "",
  };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateEditProfile(fields: EditProfileValues): EditProfileErrors {
  const result = parseEditProfile(fields);
  return result.ok ? {} : result.errors;
}
