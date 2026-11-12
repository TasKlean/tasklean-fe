/**
 * The Load more press: one further page of a group's trail. It revalidates
 * nothing, because the pages already on screen are state the server does not
 * hold and a re-render would throw them away.
 */

"use server";

import { memberRoster } from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import { GENERIC_FAILURE } from "@/lib/api/errors";
import { getGroupActivity } from "@/lib/audit/audit";
import type { AuditPageResult } from "@/lib/audit/audit.types";
import { auditFilterQuery } from "@/lib/audit/filter/filter";
import { pageFailureMessage } from "@/lib/audit/paging/paging";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";
import { parseAuditPage } from "@/lib/validation/forms/audit-page.schema/audit-page.schema";

/** Reads an action's payload as the bag of fields it should be, whatever arrived. */
function asFields(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
}

/**
 * Loads the page that follows a cursor, in the feed the cursor was issued for.
 *
 * @param uid The group, bound on the server rather than posted.
 * @param fields The cursor the last page handed back, and the filter that page
 * was read under.
 * @returns The page and the names its rows read by, or the line to show above
 * the button. A refusal is an answer rather than a throw, because the list
 * holding the pages has a failure slot and no boundary of its own.
 */
export async function loadActivityPageAction(
  uid: string,
  fields: unknown,
): Promise<AuditPageResult> {
  // The group overwrites whatever arrived under that name, so a press can only
  // ever ask for the trail of the page it sits on.
  const parsed = parseAuditPage({ ...asFields(fields), groupUid: uid });
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

  const { groupUid, cursor, type, ref, actor, from, to } = parsed.values;
  // The same zone the first page was read in, so page two covers the days the
  // reader asked for and not the container's idea of them.
  const timeZone = await readTimeZone();

  try {
    const [page, roster] = await Promise.all([
      getGroupActivity(groupUid, {
        ...auditFilterQuery(
          {
            type: type ?? null,
            ref: ref ?? "",
            actor: actor ?? "",
            from: from ?? "",
            to: to ?? "",
          },
          timeZone,
        ),
        cursor,
      }),
      memberRoster(groupUid),
    ]);

    return { ok: true, page, names: roster.names };
  } catch (error) {
    return { ok: false, message: pageFailureMessage(error) };
  }
}
