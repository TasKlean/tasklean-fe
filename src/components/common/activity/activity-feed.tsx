/**
 * The pages of a trail that are on screen, whichever trail it is. The first
 * arrives rendered from the server; every later one is appended here, so the
 * cursor lives in this component's memory and never in the URL, where a shared
 * link would carry a position the recipient has no rows for.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { ActivityTimeline } from "@/components/common/activity/activity-timeline";
import { FormNotice } from "@/components/common/form-notice";
import type { AuditEntry, AuditNames, AuditPage, AuditPageLoader } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { feedCountLabel } from "@/lib/audit/labels/labels";

type ActivityFeedProps = {
  // The press that reads the page after the cursor, in the trail this feed is
  // showing. Bound on the server, so nothing here knows which trail that is.
  loadMore: AuditPageLoader;
  // The page the server already rendered, which is where the cursor starts.
  first: AuditPage;
  viewerUid: string | null;
  now: Date;
  // Rides along with every cursor, since a cursor is a position in one narrowed
  // feed and the next page has to be read under the same filter.
  filter: AuditFilter;
  // The names the first page's rows read by, which every later page adds to:
  // the roster covers the active members, and a departure is resolved per page.
  names: AuditNames;
  // The reader's own zone, read from the cookie on the server so the days and
  // the clock are theirs and the browser hydrates to the same page.
  timeZone: string;
  // The h2 and its line, rendered on the server.
  heading: ReactNode;
  // The controls that narrow the feed. Their own slot rather than one set of
  // children, so the day switch can share their row.
  menu: ReactNode;
  // The range control, which takes the second row to itself on a phone and
  // the end of the filters' row once there is one.
  dates: ReactNode;
  // The press that takes every filter off, on a line of its own below the
  // controls, which is empty while nothing is narrowing the feed.
  clear: ReactNode;
};

const MORE =
  "text-label-md gap-space-xs px-space-md border-border/60 text-muted-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the trail, a page at a time. */
export function ActivityFeed({
  loadMore,
  first,
  viewerUid,
  now,
  filter,
  names,
  timeZone,
  heading,
  menu,
  dates,
  clear,
}: Readonly<ActivityFeedProps>) {
  const [entries, setEntries] = useState<AuditEntry[]>(first.entries);
  const [held, setHeld] = useState<AuditNames>(names);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [total, setTotal] = useState(first.total);
  const [error, setError] = useState<string | null>(null);
  // A plain flag rather than `useTransition`: a press the reader is waiting on
  // wants its rows at once, and a transition is deprioritised by design.
  const [pending, setPending] = useState(false);
  // Held here rather than in the timeline, because an appended page must not
  // reset it: the timeline is redrawn whenever rows arrive.
  const [grouped, setGrouped] = useState(true);

  const count = feedCountLabel(entries.length, total);

  /** Asks for the page after the cursor and appends it. */
  async function readMore(): Promise<void> {
    setPending(true);

    const result = await loadMore({
      cursor,
      type: filter.type ?? undefined,
      ref: filter.ref || undefined,
      actor: filter.actor || undefined,
      from: filter.from || undefined,
      to: filter.to || undefined,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setEntries((rows) => [...rows, ...result.page.entries]);
    // The newer read wins: it resolved the refs that have just arrived, and
    // agrees with the first one about everybody else.
    setHeld((known) => ({ ...known, ...result.names }));
    setCursor(result.page.nextCursor);
    // The newest page carries a fresh count, which is the better one to show.
    setTotal(result.page.total);
  }

  return (
    <>
      {heading}

      {/* The kind and the actor share a row on a phone, where the range takes the
          whole of the next one; one row from `sm` up, the clear press under it. */}
      <div className="gap-space-xs flex flex-col">
        <div className="gap-space-sm flex flex-col sm:flex-row sm:items-center sm:justify-end">
          {menu}

          {dates}
        </div>

        {clear}
      </div>

      <ActivityTimeline
        entries={entries}
        viewerUid={viewerUid}
        now={now}
        names={held}
        timeZone={timeZone}
        grouped={grouped}
        onFlip={() => setGrouped((was) => !was)}
      />

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      {/* The foot of the list, where the count answers the question the last
          row asks: whether there is any more of it. Said once, and here rather
          than by the heading, which a reader paging through has left behind. */}
      <div className="gap-space-sm flex flex-col items-center">
        {cursor ? (
          <button
            type="button"
            onClick={() => {
              void readMore();
            }}
            disabled={pending}
            className={MORE}
          >
            {pending ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : null}
            {pending ? "Loading" : "Load more"}
          </button>
        ) : null}

        {count ? <p className="text-label-sm text-muted-foreground">{count}</p> : null}
      </div>
    </>
  );
}
