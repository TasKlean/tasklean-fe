import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import type { MemberRoster } from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import {
  memberRoster,
  subjectName,
} from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import { ActorMenu } from "@/components/app/group/overview/activity/actor-menu/actor-menu";
import { ActivityEmpty } from "@/components/app/group/overview/activity/activity-empty";
import { ActivityFeed } from "@/components/app/group/overview/activity/activity-feed";
import { ActivitySubject } from "@/components/app/group/overview/activity/activity-subject";
import { DateMenu } from "@/components/app/group/overview/activity/date-menu/date-menu";
import { TypeMenu } from "@/components/app/group/overview/activity/type-menu/type-menu";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroupActivity } from "@/lib/audit/audit";
import type { AuditPage } from "@/lib/audit/audit.types";
import { dateChoices } from "@/lib/audit/dates/dates";
import {
  allowedActor,
  auditFilter,
  auditFilterQuery,
  narrowsTrail,
} from "@/lib/audit/filter/filter";
import { getSession } from "@/lib/auth/session/session";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";

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
  const path = `/app/groups/${encodeURIComponent(uid)}/overview/activity`;

  // The shell read this already and `getGroup` is memoised per request, so the
  // role costs nothing here. A group that would not load never gets this far.
  const { group } = await loadGroup(uid);
  const admin = isGroupAdmin(group?.myRole);
  // Read before the feed, because the filter sent to it depends on who is
  // asking: only an admin may narrow a group's trail to somebody else.
  const session = await getSession();
  const filter = allowedActor(auditFilter(await searchParams), admin, session?.userUid);
  // Read before the feed as well: the range the URL carries is in calendar
  // days, and only the reader's zone says which instants those are.
  const timeZone = await readTimeZone();
  // One instant for the whole screen, so the presets, the day headings and
  // every "2 hours ago" agree, and the browser hydrates to what was drawn.
  const now = new Date();

  let page = EMPTY;
  // What the roster can give, which is everyone the group ever had.
  let roster: MemberRoster = { names: {}, members: [], actors: [] };
  let failure: string | null = null;

  try {
    // Read together: neither answers anything about the other, and serially the
    // roster would add its own round trip to what the reader waits for. Only
    // the feed read can reject, so a failure here is always the feed's.
    [page, roster] = await Promise.all([
      getGroupActivity(uid, auditFilterQuery(filter, timeZone)),
      memberRoster(uid),
    ]);
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    // An actor filter is refused with a 403 carrying no code, so a feed that
    // asked for one must not read that as the group being gone and bounce.
    if (!filter.actor && isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  const names = roster.names;
  const ranges = dateChoices(now, timeZone);
  // The three slots below are keyed because they reach a client component as
  // props, where React validates them as list children and asks for one.
  const heading = (
    <div key="heading" className="gap-space-xs flex min-w-0 flex-col">
      <h2 className="text-headline-sm text-foreground">Activity</h2>
      <p className="text-body-md text-muted-foreground">
        {admin
          ? "Everything that has happened in this group."
          : "What you have done here, and what happened to the things you made."}
      </p>
    </div>
  );

  // Only an admin may ask for another member's actions, so a plain member is
  // offered no control rather than one that earns a refusal.
  const actors = admin ? roster.actors : [];
  const menu = (
    <div key="menu" className="gap-space-sm flex items-center">
      <TypeMenu path={path} filter={filter} members={roster.members} />
      {actors.length > 0 ? <ActorMenu path={path} filter={filter} actors={actors} /> : null}
    </div>
  );
  const dates = <DateMenu key="dates" path={path} filter={filter} choices={ranges} />;
  const subject =
    filter.type && filter.ref ? (
      <ActivitySubject
        key="subject"
        type={filter.type}
        name={subjectName(uid, filter, group?.name, names)}
        path={path}
      />
    ) : null;

  if (failure || page.entries.length === 0) {
    return (
      <section className="gap-space-md flex flex-col">
        {heading}
        <div className="gap-space-sm flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {menu}
          {dates}
        </div>
        {subject}
        {failure ? (
          <LoadError title="We could not load the activity." message={failure} />
        ) : (
          <ActivityEmpty admin={admin} filtered={narrowsTrail(filter)} />
        )}
      </section>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <ActivityFeed
        // Keyed on the filter, so changing it mounts a feed holding the new
        // first page: React would otherwise keep the pages the old one had.
        key={`${filter.type ?? "all"}:${filter.ref}:${filter.actor}:${filter.from}:${filter.to}`}
        groupUid={uid}
        first={page}
        viewerUid={session?.userUid ?? null}
        now={now}
        filter={filter}
        names={names}
        timeZone={timeZone}
        heading={heading}
        menu={menu}
        dates={dates}
        subject={subject}
      />
    </section>
  );
}
