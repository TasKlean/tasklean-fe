import type { Metadata } from "next";
import { loadAccountPageAction } from "@/app/(app)/app/settings/activity/actions/actions";
import { loadAccountTrail } from "@/app/(app)/app/settings/activity/page.helpers";
import { BackLink } from "@/components/auth/back-link";
import { ActivityEmpty } from "@/components/common/activity/activity-empty";
import { ActivityFeed } from "@/components/common/activity/activity-feed";
import { ClearFilters } from "@/components/common/activity/clear-filters";
import { DateMenu } from "@/components/common/activity/date-menu/date-menu";
import { LoadError } from "@/components/common/load-error";
import { dateChoices } from "@/lib/audit/dates/dates";
import { accountFilter, narrowsTrail } from "@/lib/audit/filter/filter";
import { getSession } from "@/lib/auth/session/session";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";

export const metadata: Metadata = {
  title: "Account activity",
};

const PATH = "/app/settings/activity";

// An account always has a trail: the row saying it was created is the first
// thing written about it, so only a range can empty this feed.
const QUIET = "Nothing has been recorded on this account yet.";

/**
 * Renders what has happened to this account, newest first.
 *
 * Self-scoped by the session, so there is nothing in the path to be refused
 * over, and no roster to read: every row is about this one account and names
 * whoever acted on it.
 */
export default async function AccountActivityPage({
  searchParams,
}: PageProps<"/app/settings/activity">) {
  const filter = accountFilter(await searchParams);
  // Read before the feed: the range the URL carries is in calendar days, and
  // only the reader's zone says which instants those are.
  const timeZone = await readTimeZone();
  const session = await getSession();
  // One instant for the whole screen, so the presets, the day headings and
  // every "2 hours ago" agree, and the browser hydrates to what was drawn.
  const now = new Date();

  const { page, failure } = await loadAccountTrail(filter, timeZone);
  // The three slots below are keyed because they reach a client component as
  // props, where React validates them as list children and asks for one.
  const heading = (
    <div key="heading" className="gap-space-xs flex min-w-0 flex-col">
      <div className="flex items-center lg:hidden">
        <BackLink href="/app/settings" label="Back to settings" />
      </div>

      <h2 className="text-headline-sm text-foreground">Account activity</h2>
      <p className="text-body-md text-muted-foreground">
        Sign-ins, and every change made to your account.
      </p>
    </div>
  );

  const dates = (
    <DateMenu key="dates" path={PATH} filter={filter} choices={dateChoices(now, timeZone)} />
  );
  const clear = <ClearFilters key="clear" path={PATH} filter={filter} />;

  if (failure || page.entries.length === 0) {
    return (
      <section className="gap-space-md flex flex-col">
        {heading}

        <div className="gap-space-xs flex flex-col">
          <div className="gap-space-sm flex flex-col sm:flex-row sm:items-center sm:justify-end">
            {dates}
          </div>
          {clear}
        </div>

        {failure ? (
          <LoadError title="We could not load your account activity." message={failure} />
        ) : (
          <ActivityEmpty quiet={QUIET} filtered={narrowsTrail(filter)} />
        )}
      </section>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <ActivityFeed
        // Keyed on the range, so changing it mounts a feed holding the new
        // first page: React would otherwise keep the pages the old one had.
        key={`${filter.from}:${filter.to}`}
        loadMore={loadAccountPageAction}
        first={page}
        viewerUid={session?.userUid ?? null}
        now={now}
        filter={filter}
        names={{}}
        timeZone={timeZone}
        heading={heading}
        menu={null}
        dates={dates}
        clear={clear}
      />
    </section>
  );
}
