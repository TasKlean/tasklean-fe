/**
 * The audit trail's wire shapes and the page a screen renders. The wire half is
 * all-optional because nothing is marked `required` in `openapi.json`; the
 * normalised half is what `audit.ts` hands back, so no caller writes `?? []`.
 *
 * No `server-only`: a client component renders these.
 */

import type { AuditEntityType } from "@/lib/audit/entity/entity";

export type AuditActor = {
  uid?: string;
  name?: string;
  lastName?: string;
  photoUrl?: string;
};

// One field an update touched. Both values absent means the backend withheld
// them, which is its default: free text, secrets and internal ids are never
// kept in an append-only trail every member of a group can read. One value
// absent means the field was empty on that side of the change.
export type AuditFieldChange = {
  field?: string;
  from?: string | null;
  to?: string | null;
};

export type AuditEntity = {
  type?: string;
  // Null when the thing the entry is about is gone: the trail outlives what it
  // describes, so a ref that resolves to nothing is normal, not a failure.
  ref?: string | null;
};

// Deliberately no `ipAddress`: a group entry never carries one, and an account
// entry carries only the reader's own, so a group's feed cannot show one.
export type AuditEntry = {
  uid?: string;
  action?: string;
  // A complete English sentence composed by the backend. Display fallback only:
  // it cannot be localized, and it is not a contract to parse.
  actionMessage?: string;
  entity?: AuditEntity;
  // Absent on anything but a tracked update, and never empty: a save that
  // altered nothing writes no entry at all.
  changedFields?: AuditFieldChange[];
  // Null on entries the public auth endpoints wrote, which have no caller.
  actor?: AuditActor | null;
  // UTC with no zone marker, so it parses as local if handled naively.
  dateCreated?: string;
};

// What a screen could resolve about the thing one entry is about. A ref is an
// identifier, and the backend sends no label with it, so a name is read from
// the screen the entity belongs to or not at all.
export type AuditNamedEntity = {
  name: string;
  // The person behind a membership, so a row whose actor is also its subject
  // can say they joined rather than that they added themselves.
  userUid?: string;
};

// Keyed by the `ref` an entry's entity carries, so a feed resolves a row's
// name with one lookup and an unresolved ref simply has none.
export type AuditNames = Record<string, AuditNamedEntity>;

// One member a feed can be pinned to, in the order the roster gave them.
export type MemberChoice = {
  // The membership uid, which is what an entry's `ref` carries for a member.
  ref: string;
  name: string;
  // Whether they have left the group. The roster reaches them because the trail
  // still names them, so a picker says which names those are.
  former: boolean;
};

// One person a feed can be narrowed to the actions of. Shaped like a
// `MemberChoice` and named apart from it on purpose: this ref is a user uid,
// where that one is a membership uid, and the endpoint reads them differently.
export type ActorChoice = {
  ref: string;
  name: string;
  former: boolean;
};

export type AuditPageResponse = {
  items?: AuditEntry[];
  nextCursor?: string | null;
  total?: number;
};

export type AuditPage = {
  entries: AuditEntry[];
  // Null means this page is the last. It is the only thing that answers whether
  // more exists; a full page is not itself a signal.
  nextCursor: string | null;
  // The size of this feed as this caller sees it, narrowing and filter included.
  // A count label only, never a page count.
  total: number;
};

export type AuditQuery = {
  entityType?: AuditEntityType;
  // The identifier the rest of the API addresses that entity by, which is the
  // uid for a task, group, membership or user and the numeric id for the rest.
  entityRef?: string;
  // A user uid. Only a group admin may name anybody but themselves, and the
  // refusal is a 403 carrying no code.
  actorRef?: string;
  // ISO-8601 with an offset, inclusive. The endpoint binds an OffsetDateTime,
  // so a bare local time is a 400.
  dateFrom?: string;
  // The same format, and **exclusive**: a day's own rows need the start of the
  // next one.
  dateTo?: string;
  // Opaque, and belongs to one filter: change the filter and it must be dropped.
  cursor?: string;
  limit?: number;
};
