/**
 * Turning an audit entry into the line a reader sees. Built from `action` and
 * `entity.type`, never from the backend's `actionMessage`, which is English that
 * cannot be localized and which names nobody on a membership event while
 * printing the raw role enum. That message is the fallback for a pair we have no
 * copy for. No `server-only`: the feed renders this in the browser.
 */

import type { AuditEntry } from "@/lib/audit/audit.types";
import { fullName } from "@/lib/users/name/name";

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

const ENTITY_LABELS: Record<string, string> = {
  TASK: "Task",
  GROUP: "Group",
  GROUP_MEMBER: "Member",
  CATEGORY: "Category",
  TAG: "Tag",
  TASK_COMPLETION: "Completion",
  USER: "Account",
};

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
 * @returns One sentence, never empty.
 */
export function auditSentence(entry: AuditEntry, viewerUid?: string | null): string {
  const phrase = PHRASES[`${entry.action ?? ""}:${entry.entity?.type ?? ""}`];
  if (phrase) return `${subject(entry, viewerUid)} ${phrase}`;

  // The backend's line is a whole sentence rather than a verb phrase, so it
  // stands alone: pinned to a subject it would read "Alice Member left group".
  return entry.actionMessage?.trim() || "A change was made here";
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

/**
 * Names the kind of thing an entry is about, for the chip beside the line.
 *
 * @returns The label, or null for a type we have no word for, so the chip is
 * left out rather than printing an enum at a reader.
 */
export function entityLabel(type: string | null | undefined): string | null {
  if (!type) return null;

  return ENTITY_LABELS[type] ?? null;
}
