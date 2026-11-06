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
  // Null on entries the public auth endpoints wrote, which have no caller.
  actor?: AuditActor | null;
  // UTC with no zone marker, so it parses as local if handled naively.
  dateCreated?: string;
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
  // Opaque, and belongs to one filter: change the filter and it must be dropped.
  cursor?: string;
  limit?: number;
};
