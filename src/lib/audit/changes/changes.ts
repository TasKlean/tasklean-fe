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

// What a reader gets before their own zone is known, which is a first visit
// with no zone cookie written yet.
const FALLBACK_ZONE = "UTC";

// Past this a summary is a wall of field names, so it counts the rest and the
// full list is a line each elsewhere.
const SUMMARY_LIMIT = 3;

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
 * Writes the line for one changed field.
 *
 * @param change The field and, where the backend kept them, its values.
 * @param timeZone The zone a date value is drawn in.
 * @returns One sentence-less phrase, or null for a change naming no field. A
 * field whose values were withheld reads as having changed and nothing more.
 */
export function changePhrase(
  change: AuditFieldChange,
  timeZone: string = FALLBACK_ZONE,
): string | null {
  const label = changeFieldLabel(change);
  if (!label) return null;

  const kind = change.field ? VALUE_KINDS[change.field] : undefined;
  const from = changeValue(change.from, kind, timeZone);
  const to = changeValue(change.to, kind, timeZone);

  if (from && to) return `${label} changed from ${from} to ${to}`;
  if (to) return `${label} set to ${to}`;
  if (from) return `${label} cleared, was ${from}`;

  return `${label} changed`;
}

/**
 * Writes a line per changed field.
 *
 * @returns One phrase per field, in the order the update applied them, skipping
 * any that named no field.
 */
export function changePhrases(
  changes: AuditFieldChange[] | undefined,
  timeZone: string = FALLBACK_ZONE,
): string[] {
  return (changes ?? [])
    .map((change) => changePhrase(change, timeZone))
    .filter((phrase): phrase is string => phrase !== null);
}

/**
 * Names the fields an update moved, without their values.
 *
 * @returns One label per field, for a place with room for a list of names and
 * not a line each.
 */
export function changedFieldLabels(changes: AuditFieldChange[] | undefined): string[] {
  return (changes ?? [])
    .map((change) => changeFieldLabel(change))
    .filter((label): label is string => label !== null);
}

/**
 * Sums an update up where there is room for a line and not a list.
 *
 * @returns The first few fields by name and a count of the rest, or null for an
 * entry that is not a tracked update. Names only: a value would not fit.
 */
export function changedSummary(changes: AuditFieldChange[] | undefined): string | null {
  const labels = changedFieldLabels(changes);
  if (labels.length === 0) return null;

  const shown = labels.slice(0, SUMMARY_LIMIT).join(", ");
  const hidden = labels.length - SUMMARY_LIMIT;

  return hidden > 0 ? `Changed: ${shown} and ${hidden} more` : `Changed: ${shown}`;
}
