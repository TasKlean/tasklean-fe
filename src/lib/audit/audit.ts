/**
 * Reading a group's audit trail. Keyset-paged, newest first, and narrowed per
 * caller inside the backend's own query, so an admin and a member calling this
 * with the same arguments get different rows. Not memoised: one screen reads it,
 * and a feed that differs per caller must never share a cache.
 */

import "server-only";

import type { AuditPage, AuditPageResponse, AuditQuery } from "@/lib/audit/audit.types";
import { serverApi } from "@/lib/api/server/server";

const AUDIT_PATH = "/api/audit-logs";

/** What a page holds when the caller asks for no size, matching the backend. */
export const AUDIT_PAGE_SIZE = 20;

/** Builds the path to one group's trail, encoding a uid that came from the URL. */
function groupActivityPath(uid: string): string {
  return `${AUDIT_PATH}/groups/${encodeURIComponent(uid)}`;
}

/**
 * Reads one page of a group's trail.
 *
 * @param uid The group, as `/api/groups/mine` addresses it.
 * @param query The filter and the position to resume from. A cursor belongs to
 * the filter it was issued under, so changing either means starting again.
 * @returns The page, with absent fields read as an empty one rather than as a
 * broken contract: no field in the envelope is declared required.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise,
 * including 403 for a group that is not the caller's and 400 carrying
 * `PAGE_CURSOR_INVALID` for a cursor we did not issue.
 */
export async function getGroupActivity(uid: string, query: AuditQuery = {}): Promise<AuditPage> {
  const page = await serverApi<AuditPageResponse>(groupActivityPath(uid), {
    query: {
      entityType: query.entityType,
      entityRef: query.entityRef,
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
