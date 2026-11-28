/**
 * Turning an audit entry into the line a reader sees. Built from `action` and
 * `entity.type`, never from the backend's `actionMessage`, which is English that
 * cannot be localized and which names nobody on a membership event while
 * printing the raw role enum. That message is the fallback for a pair we have no
 * copy for. No `server-only`: the feed renders this in the browser.
 */

import type { AuditEntry, AuditNamedEntity, AuditNames } from "@/lib/audit/audit.types";
import { auditDate, changeLines, changeTail } from "@/lib/audit/changes/changes";
import { nameKey } from "@/lib/audit/entity/entity";
import type { AuditToken } from "@/lib/audit/tokens/tokens";
import { actorPin, entityPin } from "@/lib/audit/pins/pins";
import { nameToken, plainToken, refToken, valueToken } from "@/lib/audit/tokens/tokens";
import { fullName } from "@/lib/users/name/name";

/** What one row says: a line, and a detail per changed field under it. */
export type AuditLine = {
  sentence: AuditToken[];
  // Empty where the entry changed nothing, and where its one change finished
  // the sentence instead.
  details: AuditToken[][];
};

// Keyed by action and entity together, because one action reads differently per
// entity: ROLE_CHANGED is a member's role in a group and the reader's own
// platform role on their account.
const PHRASES: Record<string, string> = {
  "CREATE:GROUP": "created this group",
  "UPDATE:GROUP": "updated the group",
  "DELETE:GROUP": "deleted the group",
  "MEMBER_ADDED:GROUP_MEMBER": "added a member",
  "MEMBER_REMOVED:GROUP_MEMBER": "removed a member",
  "MEMBER_LEFT:GROUP_MEMBER": "left the group",
  "ROLE_CHANGED:GROUP_MEMBER": "changed a member's role",
  // An account's own history, where the subject is always the reader and so
  // "your" always means theirs. Five actions are missing on purpose: the ones
  // whose only copy of the device name, the count or the reason is the
  // backend's sentence, which the fallback prints whole rather than losing.
  "REGISTER:USER": "created this account",
  "LOGIN:USER": "signed in",
  "LOGOUT:USER": "signed out",
  "EMAIL_VERIFIED:USER": "verified your email address",
  "PASSWORD_CHANGED:USER": "changed your password",
  "PASSWORD_SET:USER": "set a password",
  "PASSWORD_RESET:USER": "reset your password",
  "GOOGLE_LINKED:USER": "linked a Google account",
  "GOOGLE_UNLINKED:USER": "unlinked your Google account",
  "TWO_FACTOR_ENABLED:USER": "turned on two-factor authentication",
  "TWO_FACTOR_DISABLED:USER": "turned off two-factor authentication",
  "TWO_FACTOR_RECOVERY_USED:USER": "used a recovery code",
  "RECOVERY_CODES_REGENERATED:USER": "replaced your recovery codes",
  "ALL_SESSIONS_REVOKED:USER": "signed out everywhere",
  "ACCOUNT_DELETED:USER": "deactivated this account",
  "UPDATE:USER": "updated your profile",
  "ROLE_CHANGED:USER": "changed your role",
};

// The pairs that read better for naming the member they are about, which is
// the three an admin does to somebody else. A removal is listed even though the
// roster can rarely name a member who has already left.
const NAMED_PHRASES: Record<string, (member: AuditToken) => AuditToken[]> = {
  "MEMBER_ADDED:GROUP_MEMBER": (member) => [plainToken("added "), member],
  "MEMBER_REMOVED:GROUP_MEMBER": (member) => [plainToken("removed "), member],
  "ROLE_CHANGED:GROUP_MEMBER": (member) => [plainToken("changed "), member, plainToken("'s role")],
};

// How each kind is said, named or not, which is the one place the noun lives:
// the phrases below name the thing as `{thing}` and never spell out its kind.
const KIND_NOUNS: Record<string, { named: string; nameless: string }> = {
  TASK: { named: "the {name} task", nameless: "a task" },
  CATEGORY: { named: "the {name} category", nameless: "a category" },
  TAG: { named: "the {name} tag", nameless: "a tag" },
};

// Read in place of PHRASES for a row about one of those kinds. `{thing}` is the
// thing itself, which reads as its name where the page could resolve one. A
// round, a claim and an archive are all filed against the task, the backend
// keeping a round off the trail on its own id: nobody but the member who did it
// would ever see it there.
const THING_PHRASES: Record<string, string> = {
  "CREATE:TASK": "added {thing}",
  "UPDATE:TASK": "updated {thing}",
  "DELETE:TASK": "deleted {thing}",
  "COMPLETE:TASK": "completed {thing}",
  "TASK_SKIPPED:TASK": "skipped a round of {thing}",
  "TASK_MISSED:TASK": "marked a round of {thing} as missed",
  "TASK_CLAIMED:TASK": "claimed {thing}",
  "TASK_ASSIGNED:TASK": "changed who holds {thing}",
  "TASK_ARCHIVED:TASK": "archived {thing}",
  "COMPLETION_UNDONE:TASK": "undid a round of {thing}",
  "CREATE:CATEGORY": "added {thing}",
  "UPDATE:CATEGORY": "updated {thing}",
  "DELETE:CATEGORY": "deleted {thing}",
  "CREATE:TAG": "added {thing}",
  "UPDATE:TAG": "updated {thing}",
  "DELETE:TAG": "deleted {thing}",
};

// Read in place of THING_PHRASES where the entry says which round it is about,
// which the four that are about one do. A task with no round left is worded by
// the map above: a one-off has none, so there is nothing to name.
const ROUND_PHRASES: Record<string, string> = {
  "COMPLETE:TASK": "completed the {round} round of {thing}",
  "TASK_SKIPPED:TASK": "skipped the {round} round of {thing}",
  "TASK_MISSED:TASK": "marked the {round} round of {thing} as missed",
  "COMPLETION_UNDONE:TASK": "undid the {round} round of {thing}",
};

// The field the backend carries a round on, shown rather than withheld because
// the line cannot be written without it.
const ROUND_FIELD = "dueDate";

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

/**
 * Builds a phrase from a template and the pieces its slots hold.
 *
 * @param template Our own wording, with a `{slot}` where data goes.
 * @param pieces What each slot holds, keyed by the slot's name.
 * @returns The phrase in reading order, with our copy as plain text and each
 * slot's own pieces marked as what they are.
 */
function fill(template: string, pieces: Record<string, AuditToken[]>): AuditToken[] {
  // Split on every slot at once, keeping them, so one pass serves a template
  // holding one slot or two.
  return template.split(/(\{[a-z]+\})/).flatMap((part) => {
    if (!part) return [];

    return pieces[part.slice(1, -1)] ?? [plainToken(part)];
  });
}

/**
 * Shortens an identifier to something a reader can tell two rows apart by.
 *
 * @param ref The entity's own ref, which is a uid for a task and a numeric id
 * for a category or a tag.
 * @returns The uid's first group, or null for an id, which says nothing to a
 * reader and is never shown.
 */
function shortRef(ref: string | null | undefined): string | null {
  if (!ref || /^\d+$/.test(ref)) return null;

  return ref.length > 8 ? `${ref.slice(0, 8)}...` : ref;
}

/**
 * Says how the thing an entry is about reads.
 *
 * @param type The entity's own type, which is the noun it is said with.
 * @param named What the page resolved it to, or undefined.
 * @param ref Its own identifier, which stands in where no name was resolved.
 * @returns The pieces naming it, or null for a kind said without a noun, which
 * is the group itself: the rail above the trail already names it.
 */
function thingPhrase(
  type: string | undefined,
  named: AuditNamedEntity | undefined,
  ref: string | null | undefined,
): AuditToken[] | null {
  const noun = type ? KIND_NOUNS[type] : undefined;
  if (!noun) return null;

  const pin = entityPin(type, ref);
  if (named) return fill(noun.named, { name: [nameToken(named.name, pin)] });

  // The trail outlives what it describes, so a row about a task nobody can
  // read any more still says which one it was, and still leads to its own rows.
  const short = shortRef(ref);

  return [refToken(short ? `${noun.nameless} (${short})` : noun.nameless, pin)];
}

/**
 * Reads the round an entry is about.
 *
 * @param entry The entry, whose pair says whether it names one at all.
 * @returns The round's own due date as recorded, or null for an entry that
 * names no round: a one-off has none, and the backend sends the field only
 * where there is one.
 */
function roundValue(entry: AuditEntry): string | null {
  if (!ROUND_PHRASES[pairKey(entry)]) return null;

  const shown = entry.changedFields?.find((change) => change.field === ROUND_FIELD);

  return shown?.to?.trim() || null;
}

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
 * @param names What the page resolved about the entities on it, keyed by
 * `nameKey`. A row whose own entity is missing from it reads without a name.
 * @param timeZone The reader's zone, which the round an entry names is drawn
 * in, passed in like every zone-aware call.
 * @returns The pieces of one sentence, never empty, with whoever acted and
 * whoever it was about marked as the names they are.
 */
export function auditSentence(
  entry: AuditEntry,
  viewerUid: string | null | undefined,
  names: AuditNames | undefined,
  timeZone: string,
): AuditToken[] {
  const key = pairKey(entry);
  const type = entry.entity?.type;
  const ref = entry.entity?.ref;
  const named = type && ref ? names?.[nameKey(type, ref)] : undefined;
  // The actor is always the start of the line, and always a person: the system
  // carries no uid, so nothing there is offered as a filter.
  const who = nameToken(subject(entry, viewerUid), actorPin(entry.actor?.uid));

  // Checked before any name is used: the actor and the subject being one
  // membership changes what happened, not only how it is worded.
  if (named?.userUid && named.userUid === entry.actor?.uid) {
    const own = SELF_PHRASES[key];
    if (own) return [who, plainToken(` ${own}`)];
  }

  if (named) {
    const write = NAMED_PHRASES[key];
    if (write) {
      return [who, plainToken(" "), ...write(nameToken(named.name, entityPin(type, ref)))];
    }
  }

  const thing = thingPhrase(type, named, ref);
  const round = roundValue(entry);
  // Keyed on the round as well as the pair: an entry naming which round it is
  // about says so in the line, where one with none reads as the kind alone.
  const template = (round ? ROUND_PHRASES[key] : undefined) ?? THING_PHRASES[key];

  if (thing && template) {
    const said = fill(template, {
      thing,
      round: round ? [valueToken(auditDate(round, timeZone))] : [],
    });

    return [who, plainToken(" "), ...said];
  }

  const phrase = PHRASES[key];
  if (phrase) return [who, plainToken(` ${phrase}`)];

  // The backend's line is a whole sentence rather than a verb phrase, so it
  // stands alone: pinned to a subject it would read "Alice Member left group".
  return [plainToken(entry.actionMessage?.trim() || "A change was made here")];
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
  const sentence = auditSentence(entry, viewerUid, names, timeZone);
  // The round the line just named is not a change to show underneath it: the
  // backend sends it as a field because that is the only slot an entry has.
  const named = roundValue(entry) !== null;
  const changes = (entry.changedFields ?? []).filter(
    (change) => !named || change.field !== ROUND_FIELD,
  );
  const inline = INLINE_FIELDS[pairKey(entry)];
  const only = changes.length === 1 ? changes[0] : undefined;

  if (inline && only?.field === inline) {
    const tail = changeTail(only, timeZone);
    if (tail) return { sentence: [...sentence, plainToken(" "), ...tail], details: [] };
  }

  return { sentence, details: changeLines(changes, timeZone) };
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
