/**
 * The pages of a group's trail that are on screen. The first arrives rendered
 * from the server; every later one is appended here, so the cursor lives in
 * this component's memory and never in the URL, where a shared link would carry
 * a position the recipient has no rows for.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { loadActivityPageAction } from "@/app/(app)/app/groups/[uid]/overview/activity/actions/actions";
import { ActivityTimeline } from "@/components/app/group/overview/activity/activity-timeline";
import { DaySectionsToggle } from "@/components/app/group/overview/activity/day-sections-toggle";
import { FormNotice } from "@/components/common/form-notice";
import type { AuditEntry, AuditNames, AuditPage } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { feedCountLabel } from "@/lib/audit/labels/labels";

type ActivityFeedProps = {
  groupUid: string;
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
  // The h2 and its line, rendered on the server and placed here because the
  // count beside them counts what this component holds.
  heading: ReactNode;
  // The filter controls, which sit under the heading and above the rows.
  children: ReactNode;
};

const MORE =
  "text-label-md gap-space-xs px-space-md border-border/60 text-muted-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the trail, a page at a time. */
export function ActivityFeed({
  groupUid,
  first,
  viewerUid,
  now,
  filter,
  names,
  timeZone,
  heading,
  children,
}: Readonly<ActivityFeedProps>) {
  const [entries, setEntries] = useState<AuditEntry[]>(first.entries);
  const [held, setHeld] = useState<AuditNames>(names);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [total, setTotal] = useState(first.total);
  const [error, setError] = useState<string | null>(null);
  // A plain flag rather than `useTransition`: a press the reader is waiting on
  // wants its rows at once, and a transition is deprioritised by design.
  const [pending, setPending] = useState(false);
  // Held here rather than in the timeline, so the switch can sit in the
  // heading row with the count instead of taking a row of its own.
  const [grouped, setGrouped] = useState(true);

  const count = feedCountLabel(entries.length, total);

  /** Asks for the page after the cursor and appends it. */
  async function loadMore(): Promise<void> {
    setPending(true);

    const result = await loadActivityPageAction({
      groupUid,
      cursor,
      type: filter.type ?? undefined,
      ref: filter.ref || undefined,
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
      <div className="gap-space-md flex flex-wrap items-start justify-between">
        {heading}

        <div className="gap-space-md flex shrink-0 items-center">
          <DaySectionsToggle on={grouped} onFlip={() => setGrouped((was) => !was)} />
          {count ? <p className="text-label-sm text-muted-foreground">{count}</p> : null}
        </div>
      </div>

      {children}

      <ActivityTimeline
        entries={entries}
        viewerUid={viewerUid}
        now={now}
        names={held}
        timeZone={timeZone}
        grouped={grouped}
      />

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      {/* The foot of the list, where the count answers the question the last
          row asks: whether there is any more of it. */}
      <div className="gap-space-sm flex flex-col items-center">
        {cursor ? (
          <button
            type="button"
            onClick={() => {
              void loadMore();
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
