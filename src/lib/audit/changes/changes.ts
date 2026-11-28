/**
 * Turning one field of an update into the line a reader sees. The backend
 * withholds a value unless it is safe to keep forever and show every member, so
 * a change names its field and carries its values only sometimes, and the
 * phrasing has to read for both. No `server-only`: the feed renders this in the
 * browser.
 */

import type { AuditFieldChange } from "@/lib/audit/audit.types";
import type { AuditToken } from "@/lib/audit/tokens/tokens";
import { fieldToken, plainToken, valueToken } from "@/lib/audit/tokens/tokens";
import { roleLabel } from "@/lib/groups/labels/labels";
import { isGroupRole } from "@/lib/groups/role/role";
import { humanise, humanisedConstant } from "@/lib/text/humanise/humanise";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { FALLBACK_TIME_ZONE } from "@/lib/time/zone/zone";

type ValueKind = "role" | "date" | "flag" | "minutes";

// How a field's value reads, for the few that are not plain text. Anything
// absent here falls to `humanisedConstant`, which still words an enum nothing has
// seen rather than printing the backend's constant at a reader.
const VALUE_KINDS: Record<string, ValueKind> = {
  role: "role",
  nextDueDate: "date",
  // The round an entry is about, which the backend sends as a shown value
  // rather than as a change: a round is a fact, not an edit.
  dueDate: "date",
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
  // What the task endpoints actually send, despite the name: the value is a
  // membership id like the one above it.
  assignedToUid: "Assignee",
  defaultAssigneeUid: "Task owner",
  categoryId: "Category",
  requiresPhotoProof: "Photo proof",
  estimatedTimeMinutes: "Estimated time",
  nextDueDate: "Due date",
  recurrenceType: "Repeat",
  recurrencePattern: "Repeat pattern",
  color: "Colour",
};

/**
 * Draws a date the trail recorded, wherever one is read: a changed value, or
 * the round an entry names.
 *
 * @param value The recorded value, which is an API timestamp.
 * @param timeZone The reader's own zone, passed in like every zone-aware call,
 * so the server's render and the browser's hydration cannot disagree.
 * @returns The day it reads as. The trail is append-only, so a value a past
 * build recorded is whatever it recorded: an unparseable one reads as itself
 * rather than throwing a render.
 */
export function auditDate(value: string, timeZone: string): string {
  try {
    const at = parseApiDateOrNull(value);
    if (!at) return humanisedConstant(value);

    return at.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    });
  } catch {
    return humanisedConstant(value);
  }
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
    return isGroupRole(text) ? roleLabel(text) : humanisedConstant(text);
  }

  if (kind === "flag") return text === "true" ? "Yes" : "No";
  if (kind === "minutes") return `${text} min`;

  if (kind === "date") return auditDate(text, timeZone);

  return humanisedConstant(text);
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
 * @returns The pieces of one sentence-less phrase, or null for a change naming
 * no field. A field whose values were withheld reads as having changed and
 * nothing more, which is a line with nothing to set apart in it.
 */
export function changeLine(
  change: AuditFieldChange,
  timeZone: string = FALLBACK_TIME_ZONE,
): AuditToken[] | null {
  const label = changeFieldLabel(change);
  if (!label) return null;

  const { from, to } = sides(change, timeZone);

  if (from && to) {
    return [
      fieldToken(label),
      plainToken(" changed from "),
      valueToken(from),
      plainToken(" to "),
      valueToken(to),
    ];
  }

  if (to) return [fieldToken(label), plainToken(" set to "), valueToken(to)];
  if (from) return [fieldToken(label), plainToken(" cleared, was "), valueToken(from)];

  return [fieldToken(label), plainToken(" changed")];
}

/**
 * Writes the values of a change as the end of a sentence that has already
 * named the field.
 *
 * @returns The pieces of the tail, or null where there is no new value to end
 * on: with nothing to show, or only a value that is gone, the sentence has to
 * say the field's name itself and this is not the place for it.
 */
export function changeTail(
  change: AuditFieldChange,
  timeZone: string = FALLBACK_TIME_ZONE,
): AuditToken[] | null {
  const { from, to } = sides(change, timeZone);
  if (!to) return null;

  if (from) {
    return [plainToken("from "), valueToken(from), plainToken(" to "), valueToken(to)];
  }

  return [plainToken("to "), valueToken(to)];
}

/**
 * Writes a line per changed field.
 *
 * @returns One line per field, in the order the update applied them, skipping
 * any that named no field.
 */
export function changeLines(
  changes: AuditFieldChange[] | undefined,
  timeZone: string = FALLBACK_TIME_ZONE,
): AuditToken[][] {
  return (changes ?? [])
    .map((change) => changeLine(change, timeZone))
    .filter((line): line is AuditToken[] => line !== null);
}
