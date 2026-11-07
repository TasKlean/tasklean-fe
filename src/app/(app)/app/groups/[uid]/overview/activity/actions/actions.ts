/**
 * The Load more press: one further page of a group's trail. It revalidates
 * nothing, because the pages already on screen are state the server does not
 * hold and a re-render would throw them away.
 */

"use server";

import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { GENERIC_FAILURE, isApiError } from "@/lib/api/errors";
import { getGroupActivity } from "@/lib/audit/audit";
import type { AuditPage } from "@/lib/audit/audit.types";
import { auditFilterQuery } from "@/lib/audit/filter/filter";
import { parseAuditPage } from "@/lib/validation/forms/audit-page.schema/audit-page.schema";

// Read here alone, so it stays here rather than in api/error-codes.
const PAGE_CURSOR_INVALID = "PAGE_CURSOR_INVALID";

// Never retried from the first page: a cursor is ours to hand back unchanged,
// so a refused one is our own bug, and a silent restart would re-show rows the
// reader already has while losing where they were.
const DEAD_CURSOR = "We could not load more activity. Reload the page to start again.";

export type ActivityPageResult = { ok: true; page: AuditPage } | { ok: false; message: string };

/**
 * Loads the page that follows a cursor, in the feed the cursor was issued for.
 *
 * @param fields The group, the cursor the last page handed back, and the filter
 * that page was read under.
 * @returns The page, or the line to show above the button. A refusal is an
 * answer rather than a throw, because the list holding the pages has a failure
 * slot and no boundary of its own.
 */
export async function loadActivityPageAction(fields: unknown): Promise<ActivityPageResult> {
  const parsed = parseAuditPage(fields);
  if (!parsed.ok) {
    return {
      ok: false,
      message:
        parsed.errors.cursor ??
        parsed.errors.type ??
        parsed.errors.ref ??
        parsed.errors.groupUid ??
        GENERIC_FAILURE,
    };
  }

  const { groupUid, cursor, type, ref } = parsed.values;

  try {
    const page = await getGroupActivity(groupUid, {
      ...auditFilterQuery({ type: type ?? null, ref: ref ?? "" }),
      cursor,
    });
    return { ok: true, page };
  } catch (error) {
    if (isApiError(error) && error.code === PAGE_CURSOR_INVALID) {
      return { ok: false, message: DEAD_CURSOR };
    }

    return { ok: false, message: actionFailureMessage(error) };
  }
}
