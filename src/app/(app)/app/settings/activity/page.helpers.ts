/**
 * Reading the caller's own account history. No roster and no names: every row
 * is about the one account the session names, and each row carries whoever
 * acted on it already.
 */

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getAccountActivity } from "@/lib/audit/audit";
import type { AuditPage } from "@/lib/audit/audit.types";
import { auditFilterQuery } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

/** The first page of an account's trail, and why it is not there. */
export type AccountTrailView = {
  page: AuditPage;
  // The line shown in the feed's place, null where it loaded.
  failure: string | null;
};

const EMPTY_PAGE: AuditPage = { entries: [], nextCursor: null, total: 0 };

/**
 * Reads the first page of the caller's own trail.
 *
 * @param filter The range the URL carried.
 * @param timeZone The reader's zone, which the range is read in.
 * @returns The page, or the line to show where it was refused. There is no
 * bounce to make: the endpoint names nobody, so a refusal here is a failure
 * rather than something that is not the reader's.
 * @throws A redirect for a dead session, and anything that is not an `ApiError`.
 */
export async function loadAccountTrail(
  filter: AuditFilter,
  timeZone: string,
): Promise<AccountTrailView> {
  try {
    const page = await getAccountActivity(auditFilterQuery(filter, timeZone));

    return { page, failure: null };
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (!isApiError(error)) throw error;

    return { page: EMPTY_PAGE, failure: error.message };
  }
}
