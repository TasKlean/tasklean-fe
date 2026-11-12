/**
 * The Load more press: one further page of the caller's own trail. It
 * revalidates nothing, because the pages already on screen are state the server
 * does not hold and a re-render would throw them away.
 */

"use server";

import { GENERIC_FAILURE } from "@/lib/api/errors";
import { getAccountActivity } from "@/lib/audit/audit";
import type { AuditPageResult } from "@/lib/audit/audit.types";
import { auditFilterQuery } from "@/lib/audit/filter/filter";
import { pageFailureMessage } from "@/lib/audit/paging/paging";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";
import { parseAccountPage } from "@/lib/validation/forms/account-page.schema/account-page.schema";

/**
 * Loads the page that follows a cursor, in the range the cursor was issued for.
 *
 * @param fields The cursor the last page handed back, and the range that page
 * was read under.
 * @returns The page, or the line to show above the button. A refusal is an
 * answer rather than a throw, because the list holding the pages has a failure
 * slot and no boundary of its own.
 */
export async function loadAccountPageAction(fields: unknown): Promise<AuditPageResult> {
  const parsed = parseAccountPage(fields);
  if (!parsed.ok) {
    return {
      ok: false,
      message: parsed.errors.cursor ?? parsed.errors.from ?? parsed.errors.to ?? GENERIC_FAILURE,
    };
  }

  const { cursor, from, to } = parsed.values;
  // The same zone the first page was read in, so page two covers the days the
  // reader asked for and not the container's idea of them.
  const timeZone = await readTimeZone();

  try {
    const page = await getAccountActivity({
      ...auditFilterQuery(
        { type: null, ref: "", actor: "", from: from ?? "", to: to ?? "" },
        timeZone,
      ),
      cursor,
    });

    // No names: an account's rows are about the account, and nothing on one is
    // a ref a screen would have to look up.
    return { ok: true, page, names: {} };
  } catch (error) {
    return { ok: false, message: pageFailureMessage(error) };
  }
}
