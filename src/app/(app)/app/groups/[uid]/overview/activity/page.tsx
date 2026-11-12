import type { Metadata } from "next";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { loadActivityPageAction } from "@/app/(app)/app/groups/[uid]/overview/activity/actions/actions";
import {
  loadTrail,
  subjectName,
} from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import { ActorMenu } from "@/components/app/group/overview/activity/actor-menu/actor-menu";
import { TypeMenu } from "@/components/app/group/overview/activity/type-menu/type-menu";
import { ActivityEmpty } from "@/components/common/activity/activity-empty";
import { ActivityFeed } from "@/components/common/activity/activity-feed";
import { ClearFilters } from "@/components/common/activity/clear-filters";
import { DateMenu } from "@/components/common/activity/date-menu/date-menu";
import { LoadError } from "@/components/common/load-error";
import { dateChoices } from "@/lib/audit/dates/dates";
import { allowedActor, auditFilter, narrowsTrail } from "@/lib/audit/filter/filter";
import { getSession } from "@/lib/auth/session/session";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";

export const metadata: Metadata = {
  title: "Activity",
};

// A member's rows are narrowed by the backend, so an empty feed is correct for
// them in a busy household and may never read as "nothing happened".
const QUIET_ADMIN = "Nothing has happened in this group yet.";

const QUIET_MEMBER =
  "Nothing here you can see yet. You will see what you do in this group, and what happens to the things you make.";

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

  // The feed and the roster the names come from, with a dead session and a
  // group that is not the reader's already turned into a redirect.
  const { page, roster, failure } = await loadTrail(uid, filter, timeZone);
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
      <TypeMenu
        path={path}
        filter={filter}
        members={roster.members}
        pinned={subjectName(uid, filter, group?.name, names)}
      />
      {actors.length > 0 ? <ActorMenu path={path} filter={filter} actors={actors} /> : null}
    </div>
  );
  const dates = <DateMenu key="dates" path={path} filter={filter} choices={ranges} />;
  // Keyed like the other slots, since it reaches the feed as a named prop.
  const clear = <ClearFilters key="clear" path={path} filter={filter} />;

  if (failure || page.entries.length === 0) {
    return (
      <section className="gap-space-md flex flex-col">
        {heading}
        <div className="gap-space-xs flex flex-col">
          <div className="gap-space-sm flex flex-col sm:flex-row sm:items-center sm:justify-between">
            {menu}
            {dates}
          </div>
          {clear}
        </div>
        {failure ? (
          <LoadError title="We could not load the activity." message={failure} />
        ) : (
          <ActivityEmpty
            quiet={admin ? QUIET_ADMIN : QUIET_MEMBER}
            filtered={narrowsTrail(filter)}
          />
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
        // Bound here, so the feed asks for more of this group's trail without
        // holding the group, which is the one thing about it that is not shared.
        loadMore={loadActivityPageAction.bind(null, uid)}
        first={page}
        viewerUid={session?.userUid ?? null}
        now={now}
        filter={filter}
        names={names}
        timeZone={timeZone}
        heading={heading}
        menu={menu}
        dates={dates}
        clear={clear}
      />
    </section>
  );
}
