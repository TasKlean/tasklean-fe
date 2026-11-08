/**
 * Turning an audit entry into the line a reader sees. Built from `action` and
 * `entity.type`, never from the backend's `actionMessage`, which is English that
 * cannot be localized and which names nobody on a membership event while
 * printing the raw role enum. That message is the fallback for a pair we have no
 * copy for. No `server-only`: the feed renders this in the browser.
 */

import type { AuditEntry, AuditNames } from "@/lib/audit/audit.types";
import { changePhrases, changeTail } from "@/lib/audit/changes/changes";
import { fullName } from "@/lib/users/name/name";

/** What one row says: a line, and a detail per changed field under it. */
export type AuditLine = {
  sentence: string;
  // Empty where the entry changed nothing, and where its one change finished
  // the sentence instead.
  details: string[];
};

// Keyed by action and entity together, because one action reads differently per
// entity: CREATE is "added a task" on a task and "created this group" on a group.
const PHRASES: Record<string, string> = {
  "CREATE:GROUP": "created this group",
  "UPDATE:GROUP": "updated the group",
  "DELETE:GROUP": "deleted the group",
  "CREATE:TASK": "added a task",
  "UPDATE:TASK": "updated a task",
  "DELETE:TASK": "deleted a task",
  "COMPLETE:TASK": "completed a task",
  "MEMBER_ADDED:GROUP_MEMBER": "added a member",
  "MEMBER_REMOVED:GROUP_MEMBER": "removed a member",
  "MEMBER_LEFT:GROUP_MEMBER": "left the group",
  "ROLE_CHANGED:GROUP_MEMBER": "changed a member's role",
  "CREATE:CATEGORY": "added a category",
  "UPDATE:CATEGORY": "renamed a category",
  "DELETE:CATEGORY": "deleted a category",
  "CREATE:TAG": "added a tag",
  "UPDATE:TAG": "renamed a tag",
  "DELETE:TAG": "deleted a tag",
  "CREATE:TASK_COMPLETION": "marked a task done",
  "DELETE:TASK_COMPLETION": "undid a completion",
};

// The pairs that read better for naming the member they are about, which is
// the three an admin does to somebody else. A removal is listed even though the
// roster can rarely name a member who has already left.
const NAMED_PHRASES: Record<string, (name: string) => string> = {
  "MEMBER_ADDED:GROUP_MEMBER": (name) => `added ${name}`,
  "MEMBER_REMOVED:GROUP_MEMBER": (name) => `removed ${name}`,
  "ROLE_CHANGED:GROUP_MEMBER": (name) => `changed ${name}'s role`,
};

// Where the actor is also the membership the entry is about, which is every
// group creation and every join by code: nobody there added themselves.
const SELF_PHRASES: Record<string, string> = {
  "MEMBER_ADDED:GROUP_MEMBER": "joined the group",
};

// A pair whose line already names the field it moved, so one change to that
// field can finish the sentence rather than repeat its name underneath.
const INLINE_FIELDS: Record<string, string> = {
  "ROLE_CHANGED:GROUP_MEMBER": "role",
};

/** Keys one entry's copy, which is its action and its entity together. */
function pairKey(entry: AuditEntry): string {
  return `${entry.action ?? ""}:${entry.entity?.type ?? ""}`;
}

/** Names whoever acted, from the reader's side of it. */
function subject(entry: AuditEntry, viewerUid: string | null | undefined): string {
  const actor = entry.actor;
  // Absent on entries the public auth endpoints wrote, which have no caller.
  if (!actor) return "The system";
  if (viewerUid && actor.uid === viewerUid) return "You";

  return fullName(actor.name, actor.lastName) ?? "Someone";
}

/**
 * Writes the line for one entry.
 *
 * @param entry The entry, whose action, entity and actor may all be absent.
 * @param viewerUid The reader's own user uid, so their own rows say "You".
 * @param names What the page resolved about the entities on it, keyed by ref.
 * A row whose own ref is missing from it reads without a name.
 * @returns One sentence, never empty.
 */
export function auditSentence(
  entry: AuditEntry,
  viewerUid?: string | null,
  names?: AuditNames,
): string {
  const key = pairKey(entry);
  const ref = entry.entity?.ref;
  const named = ref ? names?.[ref] : undefined;
  const who = subject(entry, viewerUid);

  // Checked before any name is used: the actor and the subject being one
  // membership changes what happened, not only how it is worded.
  if (named?.userUid && named.userUid === entry.actor?.uid) {
    const own = SELF_PHRASES[key];
    if (own) return `${who} ${own}`;
  }

  if (named) {
    const write = NAMED_PHRASES[key];
    if (write) return `${who} ${write(named.name)}`;
  }

  const phrase = PHRASES[key];
  if (phrase) return `${who} ${phrase}`;

  // The backend's line is a whole sentence rather than a verb phrase, so it
  // stands alone: pinned to a subject it would read "Alice Member left group".
  return entry.actionMessage?.trim() || "A change was made here";
}

/**
 * Writes everything one row says.
 *
 * @param entry The entry.
 * @param viewerUid The reader's own user uid, so their own rows say "You".
 * @param names What the page resolved about the entities on it, keyed by ref.
 * @param timeZone The zone a date among the values is drawn in.
 * @returns The line, and a detail per changed field for the card under it. One
 * change to a field the line already names ends the sentence instead, so a row
 * reads as a sentence wherever the trail gives us enough to write one.
 */
export function auditLine(
  entry: AuditEntry,
  viewerUid: string | null | undefined,
  names: AuditNames | undefined,
  timeZone: string,
): AuditLine {
  const sentence = auditSentence(entry, viewerUid, names);
  const changes = entry.changedFields ?? [];
  const inline = INLINE_FIELDS[pairKey(entry)];
  const only = changes.length === 1 ? changes[0] : undefined;

  if (inline && only?.field === inline) {
    const tail = changeTail(only, timeZone);
    if (tail) return { sentence: `${sentence} ${tail}`, details: [] };
  }

  return { sentence, details: changePhrases(changes, timeZone) };
}

/**
 * Counts what the reader has on screen against what they can reach.
 *
 * @param shown How many rows are loaded, which grows a page at a time.
 * @param total The backend's own count, which is narrowed per caller: two
 * people legitimately see different numbers for one household.
 * @returns The progress while more exists, the plain count once it does not,
 * or null when there is nothing to label.
 */
export function feedCountLabel(shown: number, total: number): string | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  if (shown < total) return `${shown} of ${total}`;

  return `${total} ${total === 1 ? "entry" : "entries"}`;
}
