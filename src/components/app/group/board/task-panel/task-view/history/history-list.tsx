/**
 * The rounds a task has recorded, a page at a time. The first page arrives
 * rendered from the server and every later one is appended here, so the cursor
 * lives in this component's memory rather than in the URL, where a shared link
 * would carry a position the recipient has no rows for.
 */

"use client";

import { History, Loader2 } from "lucide-react";
import { useState } from "react";
import { HistoryRow } from "@/components/app/group/board/task-panel/task-view/history/history-row";
import { FormNotice } from "@/components/common/form-notice";
import type {
  RoundPage,
  RoundPageLoader,
  TaskCompletion,
} from "@/lib/tasks/completions/completions.types";
import { roundHref } from "@/lib/tasks/filter/filter";

type HistoryListProps = {
  // The press that reads the page after the cursor, with the task already
  // bound to it, so nothing here can name another one's history.
  loadMore: RoundPageLoader;
  first: RoundPage;
  // The task's own link, which every row hangs its own `round=` off.
  taskHref: string;
  now: Date;
  timeZone: string;
};

const SECTION = "gap-space-xs text-label-md text-muted-foreground flex items-center";

const MORE =
  "text-label-md gap-space-xs px-space-md border-border/60 text-muted-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const ICON = "size-4 shrink-0";

/** Renders the task's history, a page at a time. */
export function HistoryList({
  loadMore,
  first,
  taskHref,
  now,
  timeZone,
}: Readonly<HistoryListProps>) {
  const [rounds, setRounds] = useState<TaskCompletion[]>(first.rounds);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [total, setTotal] = useState(first.total);
  const [error, setError] = useState<string | null>(null);
  // A plain flag rather than `useTransition`: a press the reader is waiting on
  // wants its rows at once, and a transition is deprioritised by design.
  const [pending, setPending] = useState(false);

  /** Asks for the page after the cursor and appends it. */
  async function more() {
    if (!cursor || pending) return;

    setPending(true);
    setError(null);
    const result = await loadMore({ cursor });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setRounds((held) => [...held, ...result.page.rounds]);
    setCursor(result.page.nextCursor);
    setTotal(result.page.total);
  }

  if (rounds.length === 0) return null;

  return (
    <section className="gap-space-sm flex flex-col">
      <h3 className={SECTION}>
        <History className={ICON} aria-hidden />
        Completion history
      </h3>

      <div className="gap-space-sm flex flex-col">
        {rounds.map((round) =>
          round.id ? (
            <HistoryRow
              key={round.id}
              round={round}
              href={roundHref(taskHref, round.id)}
              now={now}
              timeZone={timeZone}
            />
          ) : null,
        )}
      </div>

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <div className="gap-space-sm flex flex-col items-center">
        {cursor ? (
          <button type="button" onClick={() => void more()} disabled={pending} className={MORE}>
            {pending ? (
              <Loader2 className={`${ICON} motion-safe:animate-spin`} aria-hidden />
            ) : null}
            {pending ? "Loading..." : "Load more"}
          </button>
        ) : null}

        <p className="text-label-sm text-muted-foreground">
          {rounds.length} of {total} {total === 1 ? "round" : "rounds"}
        </p>
      </div>
    </section>
  );
}
