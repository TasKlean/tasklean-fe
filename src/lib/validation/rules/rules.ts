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
import { NOTIFICATION_TYPES } from "@/lib/notifications/settings/settings.types";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, UPLOAD_PURPOSES } from "@/lib/uploads/uploads.types";
import { AUDIT_FILTER_TYPES } from "@/lib/audit/filter/filter.types";
import { RECURRENCE_TYPES, TASK_PRIORITY_VALUES } from "@/lib/tasks/tasks/tasks.types";

// Stricter than the backend's `@Email`, which accepts a dotless domain. The
// classes exclude the dot that separates the labels, so nothing backtracks.
const EMAIL = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

// RFC 5321's limit. It bounds what the pattern above runs on, which matters
// because the action parses whatever was posted, however long.
const EMAIL_MAX_LENGTH = 254;

// RenameDeviceRequest's own @Size, so a refusal comes from here, not a 400.
const DEVICE_NAME_MAX_LENGTH = 255;

// FieldLimits.NAME, which bounds every part of a person's name. Exported
// because the forms that post them have to stop typing at the same number.
export const NAME_MAX_LENGTH = 100;

// GroupRequest's own @Size, so a refusal comes from here, not a 400. Exported
// because the form that posts the field has to stop typing at the same number.
export const GROUP_NAME_MAX_LENGTH = 255;

// Deliberately shorter than the backend's 2000: a description is a line on a
// card, and a thousand characters of it is a wall nobody reads.
export const GROUP_DESCRIPTION_MAX_LENGTH = 500;

// CategoryCreateRequest and TagCreateRequest share one `@Size`, and both names
// normalise identically. Exported because the forms that post them have to stop
// typing at the same number.
export const LABEL_NAME_MAX_LENGTH = 100;

// `FieldLimits.SEARCH_TEXT`, which the group list and the task board are both
// refused a longer search by. Exported because each caps its own box with it.
export const QUERY_MAX_LENGTH = 100;

// `TaskCreateRequest.name`, which is longer than a label's.
export const TASK_NAME_MAX_LENGTH = 255;

// `TaskCreateRequest.description`, where the backend allows the full 2000 a
// group's description is also capped at 500 for.
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

// `CompleteTaskRequest.note`'s own `@Size`, which is what a reader may say
// about one round rather than about the task.
export const TASK_NOTE_MAX_LENGTH = 1000;

// The minutes a task may be estimated at, which the backend bounds on both
// sides: a day's worth is the ceiling.
export const TASK_MINUTES_MIN = 1;
export const TASK_MINUTES_MAX = 1440;

// `TaskCreateRequest.tagNames`'s own `@Size`. Exported because the picker stops
// offering more at the same number.
export const TASK_TAGS_MAX = 5;

// The icon column's own `@Size`. Shape only: which names the set holds is the
// picker's business, and one it does not know draws nothing rather than failing.
const LABEL_ICON_MAX_LENGTH = 50;

// The colour columns hold seven characters and nothing else, so this pattern is
// the whole of the backend's own validation too.
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Eight characters, generated upper-case from a UUID prefix.
const INVITE_CODE = /^[A-Z\d]{8}$/;

// A uid is a UUID, and this bounds a hidden field before it becomes a path
// segment. Generous rather than exact, in case that format ever changes.
const UID_MAX_LENGTH = 64;

// AuditLogQueryRequest's own @Size, so an over-long cursor is refused here
// rather than coming back as a 400.
const CURSOR_MAX_LENGTH = 128;

// FieldLimits.UID, which is what an entity ref is bounded by whichever kind of
// identifier it carries.
const ENTITY_REF_MAX_LENGTH = 100;

/** A required, trimmed address. */
export const emailRule = z
  .string({ error: "Enter your email address." })
  .check(
    z.trim(),
    z.minLength(1, "Enter your email address."),
    z.maxLength(EMAIL_MAX_LENGTH, "Enter a valid email address."),
    z.regex(EMAIL, "Enter a valid email address."),
  );

/** Required, trimmed free text, unbounded: a token rather than anything typed. */
export const requiredTextRule = (missing: string) =>
  z.string({ error: missing }).check(z.trim(), z.minLength(1, missing));

/** A first name: one word, since a space in it is somebody's middle name. */
export const firstNameRule = (missing: string) =>
  z
    .string({ error: missing })
    .check(
      z.trim(),
      z.minLength(1, missing),
      z.maxLength(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer.`),
      z.regex(/^\S+$/, "Use one word, without spaces."),
    );

/** A surname, where spaces are ordinary. */
export const lastNameRule = (missing: string) =>
  z
    .string({ error: missing })
    .check(
      z.trim(),
      z.minLength(1, missing),
      z.maxLength(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer.`),
    );

/**
 * A middle name: optional, trimmed, and absent once emptied rather than blank,
 * because an omitted field is how the backend is told to clear one.
 */
export const middleNameRule = z.optional(
  z.pipe(
    z
      .string()
      .check(z.trim(), z.maxLength(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer.`)),
    z.transform((value) => value || undefined),
  ),
);

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

/**
 * A uid a form may leave out, such as the picture a group need not have.
 *
 * Blank becomes absent rather than staying an empty string: the backend's own
 * field is bounded but not required, so `""` passes its validation and then
 * fails the lookup behind it as a 400.
 */
export const optionalUidRule = z.optional(
  z.pipe(
    z.string().check(z.trim(), z.maxLength(UID_MAX_LENGTH, "That picture cannot be used.")),
    z.transform((value) => value || undefined),
  ),
);

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

/**
 * A category's or a tag's name, normalised the way the backend stores it: it
 * trims and collapses any run of whitespace inside, leaving the case alone.
 *
 * Capped before collapsing, which is the order the backend runs them in: its
 * `@Size` sees the body as sent and the service normalises after.
 */
export const labelNameRule = (missing: string) =>
  z.string({ error: missing }).check(
    z.trim(),
    z.minLength(1, missing),
    z.maxLength(LABEL_NAME_MAX_LENGTH, `Use ${LABEL_NAME_MAX_LENGTH} characters or fewer.`),
    z.overwrite((value) => value.replace(/\s+/g, " ")),
  );

/**
 * A label's colour, which the picker always has one of, so this is required
 * where the wire field is not. Lower-cased, so two labels given the same swatch
 * hold the same string.
 */
export const colorRule = z.string({ error: "Pick a colour." }).check(
  z.trim(),
  z.minLength(1, "Pick a colour."),
  z.overwrite((value) => value.toLowerCase()),
  z.regex(HEX_COLOR, "Pick a colour."),
);

/**
 * A category's icon, which it need not have.
 *
 * Blank becomes absent rather than staying an empty string, because an omitted
 * field is how the backend is told to clear one.
 */
export const optionalIconRule = z.optional(
  z.pipe(
    z.string().check(z.trim(), z.maxLength(LABEL_ICON_MAX_LENGTH, "Pick an icon from the set.")),
    z.transform((value) => value || undefined),
  ),
);

/** The label a press was about, as a hidden field, so it arrives as a string. */
export const labelIdRule = z.pipe(
  z.string().check(z.regex(/^\d+$/, "Pick a label.")),
  z.transform(Number),
);

/** A label a task may be filed under, where nothing at all is none. */
export const optionalLabelIdRule = z.optional(
  z.pipe(
    z.union([z.string().check(z.regex(/^\d+$/, "Pick a category from the list.")), z.literal("")]),
    z.transform((value) => (value === "" ? undefined : Number(value))),
  ),
);

/** What a task is called, which is the one thing it cannot be saved without. */
export const taskNameRule = z
  .string({ error: "Name this task." })
  .check(
    z.trim(),
    z.minLength(1, "Name this task."),
    z.maxLength(TASK_NAME_MAX_LENGTH, `Use ${TASK_NAME_MAX_LENGTH} characters or fewer.`),
  );

/** What a task involves, which is optional and generously bounded. */
export const taskDescriptionRule = z.optional(
  z.pipe(
    z
      .string()
      .check(
        z.trim(),
        z.maxLength(
          TASK_DESCRIPTION_MAX_LENGTH,
          `Use ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
        ),
      ),
    z.transform((value) => value || undefined),
  ),
);

/** What a reader typed into a search box, which the backend caps and may be empty. */
export const searchRule = z.optional(
  z.pipe(
    z
      .string()
      .check(
        z.trim(),
        z.maxLength(QUERY_MAX_LENGTH, `Use ${QUERY_MAX_LENGTH} characters or fewer.`),
      ),
    z.transform((value) => value || undefined),
  ),
);

/** What a reader says about one recorded round, which is optional. */
export const taskNoteRule = z.optional(
  z.pipe(
    z
      .string()
      .check(
        z.trim(),
        z.maxLength(TASK_NOTE_MAX_LENGTH, `Use ${TASK_NOTE_MAX_LENGTH} characters or fewer.`),
      ),
    z.transform((value) => value || undefined),
  ),
);

/** How urgent a task is, where nothing at all means nobody said. */
export const taskPriorityRule = z.optional(
  z.pipe(
    z.union([z.enum(TASK_PRIORITY_VALUES), z.literal("")]),
    z.transform((value) => value || undefined),
  ),
);

/** How often a task comes back, where nothing at all means it happens once. */
export const recurrenceRule = z.optional(
  z.pipe(
    z.union([z.enum(RECURRENCE_TYPES), z.literal("")]),
    z.transform((value) => value || undefined),
  ),
);

/**
 * How long a task takes, typed as text and bounded on both sides.
 *
 * Empty is not zero: the field is left out of the request entirely, where a 0
 * would fail the backend's own minimum.
 */
export const taskMinutesRule = z.optional(
  z.pipe(
    z.pipe(
      z.string().check(z.trim()),
      z.transform((value) => (value === "" ? undefined : Number(value))),
    ),
    z.optional(
      z
        .int({ error: "Enter the minutes as a whole number." })
        .check(
          z.gte(TASK_MINUTES_MIN, `Give it at least ${TASK_MINUTES_MIN} minute.`),
          z.lte(TASK_MINUTES_MAX, `A task cannot take more than ${TASK_MINUTES_MAX} minutes.`),
        ),
    ),
  ),
);

/**
 * The labels on a task, as the names the backend matches and creates by.
 *
 * Folded case-insensitively before the cap, because the backend matches that
 * way: `Weekly` and `weekly` are one label and must not cost two of the five.
 */
export const tagNamesRule = z.pipe(
  z.pipe(
    z.array(z.string().check(z.trim(), z.maxLength(LABEL_NAME_MAX_LENGTH))),
    z.transform((names) => {
      const kept: string[] = [];
      const seen = new Set<string>();
      for (const name of names) {
        const folded = name.toLowerCase();
        if (name === "" || seen.has(folded)) continue;
        seen.add(folded);
        kept.push(name);
      }
      return kept;
    }),
  ),
  z
    .array(z.string())
    .check(z.maxLength(TASK_TAGS_MAX, `A task takes ${TASK_TAGS_MAX} tags at most.`)),
);

/** A clock time as a form posts one, which is optional beside its date. */
export const timeOfDayRule = z.optional(
  z.pipe(
    z
      .string()
      .check(z.trim(), z.regex(/^(([01]\d|2[0-3]):[0-5]\d)?$/, "That time cannot be used.")),
    z.transform((value) => value || undefined),
  ),
);

/**
 * A tickbox, which posts a value when it is on and nothing at all when it is
 * off.
 *
 * Either kind of input, because the same schema runs twice: a form posts the
 * box's value as text, where the component validating its own state holds the
 * boolean it rendered the box from.
 */
export const flagRule = z.pipe(
  z.optional(z.union([z.string(), z.boolean()])),
  z.transform((value) => value === true || (typeof value === "string" && value !== "")),
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

/** One of the things an upload can be for, which is what decides who may make it. */
export const uploadPurposeRule = z.enum(UPLOAD_PURPOSES, {
  error: "Pick what the upload is for.",
});

/** An image type the backend will sign for, and so what a canvas re-encodes to. */
export const imageTypeRule = z.enum(IMAGE_TYPES, {
  error: "Pick a JPEG, PNG or WebP image.",
});

/**
 * A page cursor, which a caller only ever echoes back from a previous page.
 *
 * Blank becomes absent, so a press with nothing to continue from asks for the
 * first page rather than sending an empty parameter.
 */
export const cursorRule = z.optional(
  z.pipe(
    z.string().check(z.trim(), z.maxLength(CURSOR_MAX_LENGTH, "That page cannot be loaded.")),
    z.transform((value) => value || undefined),
  ),
);

/** One of the kinds of thing a group's trail can be narrowed to. */
export const auditFilterTypeRule = z.optional(
  z.enum(AUDIT_FILTER_TYPES, { error: "That is not a kind of thing this trail records." }),
);

/**
 * The one entity a trail is pinned to, addressed the way the API addresses it.
 *
 * Blank becomes absent, so a press carrying an empty ref asks for the kind
 * rather than for an entity with no identifier.
 */
export const entityRefRule = z.optional(
  z.pipe(
    z.string().check(z.trim(), z.maxLength(ENTITY_REF_MAX_LENGTH, "That filter cannot be used.")),
    z.transform((value) => value || undefined),
  ),
);

/**
 * Whose actions a trail is narrowed to, as a user uid.
 *
 * Its own rule rather than `entityRefRule`: the two are capped the same but
 * name different things, and a membership uid sent here reads as a user that
 * does not exist.
 */
export const actorRefRule = z.optional(
  z.pipe(
    z.string().check(z.trim(), z.maxLength(ENTITY_REF_MAX_LENGTH, "That filter cannot be used.")),
    z.transform((value) => value || undefined),
  ),
);

/**
 * One end of a trail's date range, as a calendar day.
 *
 * Shape only: a range that reads backwards is a 400, and that is settled by
 * `auditFilter`, which holds both ends and this rule sees one.
 */
export const dayRule = z.optional(
  z.pipe(
    // Empty passes the pattern rather than failing it, because a field left
    // blank is no date: without that the transform below never sees one.
    z.string().check(z.trim(), z.regex(/^(\d{4}-\d{2}-\d{2})?$/, "That date cannot be used.")),
    z.transform((value) => value || undefined),
  ),
);

/** The exact byte count of what will be sent, which is signed along with it. */
export const imageSizeRule = z
  .int({ error: "That picture cannot be measured." })
  .check(
    z.gte(1, "That picture is empty."),
    z.lte(MAX_IMAGE_BYTES, `Pictures are limited to ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`),
  );
