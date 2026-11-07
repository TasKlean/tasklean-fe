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
import { ActivityRow } from "@/components/app/group/overview/activity/activity-row";
import { TimelineRow } from "@/components/app/group/overview/activity/timeline-row";
import { FormNotice } from "@/components/common/form-notice";
import type { AuditEntry, AuditPage } from "@/lib/audit/audit.types";
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
  // The h2 and its line, rendered on the server and placed here because the
  // count beside them counts what this component holds.
  heading: ReactNode;
  // The filter controls, which sit under the heading and above the rows.
  children: ReactNode;
};

const MORE =
  "text-label-md gap-space-xs px-space-md border-border/60 text-muted-foreground hover:bg-muted mx-auto flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the trail, a page at a time. */
export function ActivityFeed({
  groupUid,
  first,
  viewerUid,
  now,
  filter,
  heading,
  children,
}: Readonly<ActivityFeedProps>) {
  const [entries, setEntries] = useState<AuditEntry[]>(first.entries);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [total, setTotal] = useState(first.total);
  const [error, setError] = useState<string | null>(null);
  // A plain flag rather than `useTransition`: a press the reader is waiting on
  // wants its rows at once, and a transition is deprioritised by design.
  const [pending, setPending] = useState(false);

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
    setEntries((held) => [...held, ...result.page.entries]);
    setCursor(result.page.nextCursor);
    // The newest page carries a fresh count, which is the better one to show.
    setTotal(result.page.total);
  }

  return (
    <>
      <div className="gap-space-md flex flex-wrap items-start justify-between">
        {heading}
        {count ? <p className="text-label-sm text-muted-foreground shrink-0">{count}</p> : null}
      </div>

      {children}

      <ol className={filter.type ? "flex flex-col" : "gap-space-sm flex flex-col"}>
        {entries.map((entry, index) => {
          // The backend mints a uid for every entry; an index stands in safely
          // where one is missing, because the feed only ever grows at its end.
          const key = entry.uid ?? index;

          return filter.type ? (
            <TimelineRow key={key} entry={entry} viewerUid={viewerUid} now={now} />
          ) : (
            <ActivityRow key={key} entry={entry} viewerUid={viewerUid} now={now} />
          );
        })}
      </ol>

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

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
    </>
  );
}
