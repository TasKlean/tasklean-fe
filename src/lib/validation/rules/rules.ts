/**
 * The field-level Zod pieces every form schema composes. Only the first failing
 * check on a field is ever shown, so the order here is the order a user is
 * asked to fix things.
 */

import * as z from "zod/mini";
import {
  isGuessable,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL,
} from "@/lib/validation/password/policy/policy";
import { CODE_LENGTH } from "@/lib/validation/code-length";
import { LOCALES, THEMES } from "@/lib/preferences/preferences.types";
import { GROUP_ROLES } from "@/lib/groups/groups.types";
import { isGroupPhotoUrl } from "@/lib/groups/photo/photo";
import { NOTIFICATION_TYPES } from "@/lib/notifications/settings/settings.types";

// Stricter than the backend's `@Email`, which accepts a dotless domain. The
// classes exclude the dot that separates the labels, so nothing backtracks.
const EMAIL = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

// RFC 5321's limit. It bounds what the pattern above runs on, which matters
// because the action parses whatever was posted, however long.
const EMAIL_MAX_LENGTH = 254;

// RenameDeviceRequest's own @Size, so a refusal comes from here, not a 400.
const DEVICE_NAME_MAX_LENGTH = 255;

// GroupRequest's own @Size, so a refusal comes from here, not a 400. Exported
// because the form that posts the field has to stop typing at the same number.
export const GROUP_NAME_MAX_LENGTH = 255;

// Deliberately shorter than the backend's 2000: a description is a line on a
// card, and a thousand characters of it is a wall nobody reads.
export const GROUP_DESCRIPTION_MAX_LENGTH = 500;

// The backend's own cap on a group's photo URL.
export const GROUP_PHOTO_MAX_LENGTH = 500;

// Eight characters, generated upper-case from a UUID prefix.
const INVITE_CODE = /^[A-Z\d]{8}$/;

// A uid is a UUID, and this bounds a hidden field before it becomes a path
// segment. Generous rather than exact, in case that format ever changes.
const UID_MAX_LENGTH = 64;

/** A required, trimmed address. */
export const emailRule = z
  .string({ error: "Enter your email address." })
  .check(
    z.trim(),
    z.minLength(1, "Enter your email address."),
    z.maxLength(EMAIL_MAX_LENGTH, "Enter a valid email address."),
    z.regex(EMAIL, "Enter a valid email address."),
  );

/** A required, trimmed single word: a first name. */
export const singleWordRule = (missing: string) =>
  z
    .string({ error: missing })
    .check(z.trim(), z.minLength(1, missing), z.regex(/^\S+$/, "Use one word, without spaces."));

/** Required, trimmed free text: a surname, where spaces are ordinary. */
export const requiredTextRule = (missing: string) =>
  z.string({ error: missing }).check(z.trim(), z.minLength(1, missing));

/** Optional trimmed text, absent when blank. */
export const optionalTextRule = z.optional(z.string().check(z.trim()));

/** The full password policy. Never trimmed: it must reach the backend as typed. */
export const passwordRule = z.string({ error: "Choose a password." }).check(
  z.minLength(1, "Choose a password."),
  z.minLength(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
  z.maxLength(PASSWORD_MAX_LENGTH, `Use no more than ${PASSWORD_MAX_LENGTH} characters.`),
  z.regex(/[A-Z]/, "Add an uppercase letter."),
  z.regex(/[a-z]/, "Add a lowercase letter."),
  z.regex(/\d/, "Add a number."),
  z.regex(PASSWORD_SPECIAL, "Add a special character."),
  z.refine((value) => !isGuessable(value), {
    error: "This password is too easy to guess. Try something less common.",
  }),
);

/** Presence only. Login must not publish the policy or lock out old passwords. */
export const anyPasswordRule = z
  .string({ error: "Enter your password." })
  .check(z.minLength(1, "Enter your password."));

/** The six-digit verification code, trimmed. */
export const codeRule = z
  .string({ error: `Enter the ${CODE_LENGTH}-digit code.` })
  .check(
    z.trim(),
    z.minLength(1, `Enter the ${CODE_LENGTH}-digit code.`),
    z.regex(new RegExp(String.raw`^\d{${CODE_LENGTH}}$`), `Enter all ${CODE_LENGTH} digits.`),
  );

// Six digits from an authenticator, or an eight-character recovery code.
const TWO_FACTOR_CODE = /^(?:\d{6}|[A-Z\d]{8})$/;

// Said once, because the strict rule and the optional one refuse the same shapes.
const TWO_FACTOR_CODE_SHAPE = "Enter the 6 digits from your app, or a recovery code.";

/**
 * An authenticator code or a recovery code, normalised the way the backend
 * matches them: it strips spaces, the hyphen and the case before comparing.
 */
export const twoFactorCodeRule = z.string({ error: "Enter your code." }).check(
  z.trim(),
  z.minLength(1, "Enter your code."),
  z.overwrite((value) => value.replace(/[\s-]/g, "").toUpperCase()),
  z.regex(TWO_FACTOR_CODE, TWO_FACTOR_CODE_SHAPE),
);

/**
 * The same code where the form may legitimately send none: an account with no
 * second factor posts an empty field, or no field at all, and the backend asks
 * it for nothing.
 */
export const optionalTwoFactorCodeRule = z.optional(
  z.string().check(
    z.trim(),
    z.overwrite((value) => value.replace(/[\s-]/g, "").toUpperCase()),
    z.refine((value) => value === "" || TWO_FACTOR_CODE.test(value), {
      error: TWO_FACTOR_CODE_SHAPE,
    }),
  ),
);

/**
 * Checks a code the form knows is required, which the schema cannot: whether
 * the account has a second factor is read per page, never posted.
 *
 * @returns The first unmet rule, or nothing when the code is usable.
 */
export function twoFactorCodeError(code: string): string | undefined {
  const result = z.safeParse(twoFactorCodeRule, code);
  return result.success ? undefined : result.error.issues[0]?.message;
}

/** The device a button was pressed for: a hidden field, so it arrives as a string. */
export const deviceIdRule = z.pipe(
  z.string().check(z.regex(/^\d+$/, "Pick a device.")),
  z.transform(Number),
);

/** A device's own name, bounded by the backend's `@Size` on the column. */
export const deviceNameRule = z
  .string({ error: "Enter a name for this device." })
  .check(
    z.trim(),
    z.minLength(1, "Enter a name for this device."),
    z.maxLength(DEVICE_NAME_MAX_LENGTH, "Use 255 characters or fewer."),
  );

/** A uid posted by a hidden field, which arrives as a string like any input. */
export const uidRule = (missing: string) =>
  z
    .string({ error: missing })
    .check(z.trim(), z.minLength(1, missing), z.maxLength(UID_MAX_LENGTH, missing));

/** A group's name, bounded by the backend's `@Size` on the column. */
export const groupNameRule = z
  .string({ error: "Enter a name for the group." })
  .check(
    z.trim(),
    z.minLength(1, "Enter a name for the group."),
    z.maxLength(GROUP_NAME_MAX_LENGTH, `Use ${GROUP_NAME_MAX_LENGTH} characters or fewer.`),
  );

/** A group's description: optional, trimmed, and empty when nothing was typed. */
export const groupDescriptionRule = z.optional(
  z
    .string()
    .check(
      z.trim(),
      z.maxLength(
        GROUP_DESCRIPTION_MAX_LENGTH,
        `Use ${GROUP_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
      ),
    ),
);

/**
 * A group's picture: optional, and an https URL when there is one.
 *
 * There is no uploader anywhere in the product, so the only way to give a group
 * a picture is to paste a link to one. `http` is refused as well as the rest,
 * because the page asking for it is served over `https`.
 */
export const groupPhotoRule = z.optional(
  z.string().check(
    z.trim(),
    z.maxLength(GROUP_PHOTO_MAX_LENGTH, `Use ${GROUP_PHOTO_MAX_LENGTH} characters or fewer.`),
    z.refine((value) => value === "" || isGroupPhotoUrl(value), {
      error: "Enter a link starting with https://, or leave this empty.",
    }),
  ),
);

/**
 * An invite code, normalised to the shape the backend stores. It trims and
 * upper-cases before its own lookup; the hyphen goes too, since a code holds
 * none and someone pasting one typed it themselves.
 */
export const inviteCodeRule = z.string({ error: "Enter an invite code." }).check(
  z.trim(),
  z.minLength(1, "Enter an invite code."),
  z.overwrite((value) => value.replace(/[\s-]/g, "").toUpperCase()),
  z.regex(INVITE_CODE, "An invite code is 8 letters and numbers."),
);

/** One of the two roles a membership can hold. */
export const groupRoleRule = z.enum(GROUP_ROLES, { error: "Pick a role." });

/** One of the colour schemes the picker offers. */
export const themeRule = z.enum(THEMES, { error: "Pick a theme." });

/** One of the languages the app supports. */
export const localeRule = z.enum(LOCALES, { error: "Pick a language." });

/** One of the notification types the settings page lists. */
export const notificationTypeRule = z.enum(NOTIFICATION_TYPES, {
  error: "Pick a notification type.",
});
