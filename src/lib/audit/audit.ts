/**
 * Reading the audit trail, in the two scopes the backend answers: one group's
 * history, and the caller's own account. Keyset-paged, newest first, and
 * narrowed per caller inside the backend's own query, so an admin and a member
 * calling the group read with the same arguments get different rows. Not
 * memoised: a feed that differs per caller must never share a cache.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type { AuditPage, AuditPageResponse, AuditQuery } from "@/lib/audit/audit.types";

const AUDIT_PATH = "/api/audit-logs";

// No identifier of its own: the subject comes off the token, so the caller
// cannot name anybody else's account here.
const ACCOUNT_PATH = `${AUDIT_PATH}/account`;

/** What a page holds when the caller asks for no size, matching the backend. */
export const AUDIT_PAGE_SIZE = 20;

/** Builds the path to one group's trail, encoding a uid that came from the URL. */
function groupActivityPath(uid: string): string {
  return `${AUDIT_PATH}/groups/${encodeURIComponent(uid)}`;
}

/**
 * Reads one page of whichever trail the path names.
 *
 * @param path The scope being read.
 * @param query The filter and the position to resume from.
 * @returns The page, with absent fields read as an empty one rather than as a
 * broken contract: no field in the envelope is declared required.
 */
async function readPage(path: string, query: AuditQuery): Promise<AuditPage> {
  const page = await serverApi<AuditPageResponse>(path, {
    query: {
      entityType: query.entityType,
      entityRef: query.entityRef,
      actorRef: query.actorRef,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      cursor: query.cursor,
      limit: query.limit ?? AUDIT_PAGE_SIZE,
    },
  });

  return {
    entries: page.items ?? [],
    nextCursor: page.nextCursor ?? null,
    total: page.total ?? 0,
  };
}

/**
 * Reads one page of a group's trail.
 *
 * @param uid The group, as `/api/groups/mine` addresses it.
 * @param query The filter and the position to resume from. A cursor belongs to
 * the filter it was issued under, so changing either means starting again.
 * @returns The page.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise,
 * including 403 for a group that is not the caller's and 400 carrying
 * `PAGE_CURSOR_INVALID` for a cursor we did not issue.
 */
export async function getGroupActivity(uid: string, query: AuditQuery = {}): Promise<AuditPage> {
  return readPage(groupActivityPath(uid), query);
}

/**
 * Reads one page of the caller's own account history.
 *
 * @param query The range and the position to resume from. The endpoint takes
 * the other axes too, but every row here is already about this one account, so
 * there is nothing for them to narrow.
 * @returns The page, whose rows carry an IP address where the caller is the one
 * who acted, which a group's rows never do.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise,
 * including 400 carrying `PAGE_CURSOR_INVALID` for a cursor we did not issue.
 */
export async function getAccountActivity(query: AuditQuery = {}): Promise<AuditPage> {
  return readPage(ACCOUNT_PATH, query);
}
