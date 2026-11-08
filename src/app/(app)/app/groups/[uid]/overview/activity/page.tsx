import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import {
  memberNames,
  subjectName,
} from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import { ActivityEmpty } from "@/components/app/group/overview/activity/activity-empty";
import { ActivityFeed } from "@/components/app/group/overview/activity/activity-feed";
import { ActivityFilters } from "@/components/app/group/overview/activity/activity-filters";
import { ActivitySubject } from "@/components/app/group/overview/activity/activity-subject";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroupActivity } from "@/lib/audit/audit";
import type { AuditNames, AuditPage } from "@/lib/audit/audit.types";
import { auditFilter, auditFilterQuery } from "@/lib/audit/filter/filter";
import { getSession } from "@/lib/auth/session/session";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";

export const metadata: Metadata = {
  title: "Activity",
};

const EMPTY: AuditPage = { entries: [], nextCursor: null, total: 0 };

/**
 * Renders what has happened in this group, newest first.
 *
 * The backend narrows the rows per caller, so an admin and a member reading
 * this path see different feeds and different counts. The URL carries the
 * filter and the backend answers it; nothing is narrowed here.
 */
export default async function ActivityPage({
  params,
  searchParams,
}: PageProps<"/app/groups/[uid]/overview/activity">) {
  const { uid } = await params;
  const filter = auditFilter(await searchParams);
  const path = `/app/groups/${encodeURIComponent(uid)}/overview/activity`;

  // The shell read this already and `getGroup` is memoised per request, so the
  // role costs nothing here. A group that would not load never gets this far.
  const { group } = await loadGroup(uid);
  const admin = isGroupAdmin(group?.myRole);

  let page = EMPTY;
  // One roster read per view, which names the membership rows of this page and
  // of every page the feed goes on to append.
  let names: AuditNames = {};
  let failure: string | null = null;

  try {
    // Read together: neither answers anything about the other, and serially the
    // roster would add its own round trip to what the reader waits for. Only
    // the feed read can reject, so a failure here is always the feed's.
    [page, names] = await Promise.all([
      getGroupActivity(uid, auditFilterQuery(filter)),
      memberNames(uid),
    ]);
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  const session = await getSession();
  const heading = (
    <div className="gap-space-xs flex min-w-0 flex-col">
      <h2 className="text-headline-sm text-foreground">Activity</h2>
      <p className="text-body-md text-muted-foreground">
        {admin
          ? "Everything that has happened in this group."
          : "What you have done here, and what happened to the things you made."}
      </p>
    </div>
  );

  const controls = (
    <>
      <ActivityFilters path={path} filter={filter} />
      {filter.type && filter.ref ? (
        <ActivitySubject
          type={filter.type}
          name={subjectName(uid, filter, group?.name, names)}
          path={path}
        />
      ) : null}
    </>
  );

  if (failure || page.entries.length === 0) {
    return (
      <section className="gap-space-md flex flex-col">
        {heading}
        {controls}
        {failure ? (
          <LoadError title="We could not load the activity." message={failure} />
        ) : (
          <ActivityEmpty admin={admin} filtered={filter.type !== null} />
        )}
      </section>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <ActivityFeed
        // Keyed on the filter, so changing it mounts a feed holding the new
        // first page: React would otherwise keep the pages the old one had.
        key={`${filter.type ?? "all"}:${filter.ref}`}
        groupUid={uid}
        first={page}
        viewerUid={session?.userUid ?? null}
        // One instant for every row, so "2 hours ago" cannot disagree between
        // the server's render and the browser's.
        now={new Date()}
        filter={filter}
        names={names}
        heading={heading}
      >
        {controls}
      </ActivityFeed>
    </section>
  );
}
