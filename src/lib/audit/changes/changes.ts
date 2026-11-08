/**
 * Turning one field of an update into the line a reader sees. The backend
 * withholds a value unless it is safe to keep forever and show every member, so
 * a change names its field and carries its values only sometimes, and the
 * phrasing has to read for both. No `server-only`: the feed renders this in the
 * browser.
 */

import type { AuditFieldChange } from "@/lib/audit/audit.types";
import { GROUP_ROLES } from "@/lib/groups/groups.types";
import { roleLabel } from "@/lib/groups/labels/labels";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { FALLBACK_TIME_ZONE } from "@/lib/time/zone/zone";

type ValueKind = "role" | "date" | "flag" | "minutes";

// How a field's value reads, for the few that are not plain text. Anything
// absent here falls to `plainValue`, which still words an enum it has never
// seen rather than printing the backend's constant at a reader.
const VALUE_KINDS: Record<string, ValueKind> = {
  role: "role",
  nextDueDate: "date",
  requiresPhotoProof: "flag",
  estimatedTimeMinutes: "minutes",
};

// Only the names that read badly as the request DTO spells them.
const FIELD_LABELS: Record<string, string> = {
  photoUid: "Picture",
  taskPhotoUrl: "Picture",
  photoUrl: "Picture",
  inviteCode: "Invite code",
  // A GroupMember id, never a user's: naming it after the person it points at
  // is what keeps the three id namespaces apart.
  assignedToId: "Assignee",
  categoryId: "Category",
  requiresPhotoProof: "Photo proof",
  estimatedTimeMinutes: "Estimated time",
  nextDueDate: "Due date",
  recurrenceType: "Repeat",
  recurrencePattern: "Repeat pattern",
  color: "Colour",
};

// A backend constant: upper case, digits and underscores, nothing else.
const ENUM_VALUE = /^[A-Z][A-Z\d]*(?:_[A-Z\d]+)*$/;

/**
 * Turns a camelCase or UPPER_SNAKE name into a sentence-cased phrase.
 *
 * @returns The words with only the first capitalised, so a name this module has
 * no word for is still readable rather than printed as the backend spells it.
 */
function humanise(value: string): string {
  const words = value
    .replace(/_+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Words a value the module has no kind for.
 *
 * @returns The value humanised where it looks like one of the backend's
 * constants, and untouched otherwise, which leaves a colour, an icon token or a
 * number exactly as it was recorded.
 */
function plainValue(value: string): string {
  return ENUM_VALUE.test(value) ? humanise(value) : value;
}

/**
 * Words one side of a change.
 *
 * @param value The recorded value, which is always text on the wire.
 * @param kind How that field's values read, where it is not plain text.
 * @param timeZone The zone a date is drawn in, which is the reader's own.
 * @returns The value as a reader should see it, or null where it was empty.
 */
function changeValue(
  value: string | null | undefined,
  kind: ValueKind | undefined,
  timeZone: string,
): string | null {
  const text = value?.trim();
  if (!text) return null;

  if (kind === "role") {
    // Only a known role goes through `roleLabel`, which reads anything else as
    // a member rather than admitting it does not know the value.
    return GROUP_ROLES.some((known) => known === text) ? roleLabel(text) : plainValue(text);
  }

  if (kind === "flag") return text === "true" ? "Yes" : "No";
  if (kind === "minutes") return `${text} min`;

  if (kind === "date") {
    // The trail is append-only, so a value a past build recorded is whatever it
    // recorded: an unparseable one reads as itself rather than throwing a render.
    try {
      const at = parseApiDateOrNull(text);
      if (!at) return plainValue(text);

      return at.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone,
      });
    } catch {
      return plainValue(text);
    }
  }

  return plainValue(text);
}

/**
 * Names the field a change touched.
 *
 * @returns The label, or null for a change that arrived without a field, which
 * leaves nothing to say about it.
 */
export function changeFieldLabel(change: AuditFieldChange): string | null {
  const field = change.field?.trim();
  if (!field) return null;

  return FIELD_LABELS[field] ?? humanise(field);
}

/**
 * Words both sides of a change.
 *
 * @returns Each side as a reader should see it, with null where the backend
 * withheld it or the field was empty there.
 */
function sides(
  change: AuditFieldChange,
  timeZone: string,
): { from: string | null; to: string | null } {
  const kind = change.field ? VALUE_KINDS[change.field] : undefined;

  return {
    from: changeValue(change.from, kind, timeZone),
    to: changeValue(change.to, kind, timeZone),
  };
}

/**
 * Writes the line for one changed field.
 *
 * @param change The field and, where the backend kept them, its values.
 * @param timeZone The zone a date value is drawn in.
 * @returns One sentence-less phrase, or null for a change naming no field. A
 * field whose values were withheld reads as having changed and nothing more.
 */
export function changePhrase(
  change: AuditFieldChange,
  timeZone: string = FALLBACK_TIME_ZONE,
): string | null {
  const label = changeFieldLabel(change);
  if (!label) return null;

  const { from, to } = sides(change, timeZone);

  if (from && to) return `${label} changed from ${from} to ${to}`;
  if (to) return `${label} set to ${to}`;
  if (from) return `${label} cleared, was ${from}`;

  return `${label} changed`;
}

/**
 * Writes the values of a change as the end of a sentence that has already
 * named the field.
 *
 * @returns The tail, or null where there is no new value to end on: with
 * nothing to show, or only a value that is gone, the sentence has to say the
 * field's name itself and this is not the place for it.
 */
export function changeTail(
  change: AuditFieldChange,
  timeZone: string = FALLBACK_TIME_ZONE,
): string | null {
  const { from, to } = sides(change, timeZone);
  if (!to) return null;

  return from ? `from ${from} to ${to}` : `to ${to}`;
}

/**
 * Writes a line per changed field.
 *
 * @returns One phrase per field, in the order the update applied them, skipping
 * any that named no field.
 */
export function changePhrases(
  changes: AuditFieldChange[] | undefined,
  timeZone: string = FALLBACK_TIME_ZONE,
): string[] {
  return (changes ?? [])
    .map((change) => changePhrase(change, timeZone))
    .filter((phrase): phrase is string => phrase !== null);
}
