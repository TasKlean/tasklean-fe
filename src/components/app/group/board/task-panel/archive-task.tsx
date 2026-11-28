/**
 * Retiring a task the household has stopped doing. It keeps its history and
 * its place in a share, where deleting takes both, and **nothing brings it
 * back**: the backend has no unarchive and a save carries no status.
 *
 * Neutral rather than red, since nothing is lost, and it confirms in place
 * like the delete beside it, taking the whole row while the question is up.
 */

"use client";

import { Archive, Loader2 } from "lucide-react";
import { useState } from "react";
import { archiveTaskAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { Tooltip } from "@/components/common/tooltip/tooltip";

type ArchiveTaskProps = {
  groupUid: string;
  taskUid: string;
  // Reports the question, which the footer makes room for by taking its other
  // presses away.
  onAsking: (asking: boolean) => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
};

const PRESS =
  "border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none";

const CONFIRM =
  "bg-secondary text-secondary-foreground focus-visible:ring-ring text-label-md gap-space-xs px-space-sm flex min-h-11 shrink-0 items-center rounded-full transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const CANCEL =
  "text-label-md text-muted-foreground hover:text-foreground px-space-sm flex min-h-11 shrink-0 items-center rounded-full";

const DONE = "Archived. It has left the board.";

/** Renders the archive press and the question it turns into. */
export function ArchiveTask({
  groupUid,
  taskUid,
  onAsking,
  onDone,
  onError,
}: Readonly<ArchiveTaskProps>) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  /** Opens or closes the question, telling the footer either way. */
  function ask(next: boolean) {
    setAsking(next);
    onAsking(next);
  }

  /** Retires the task, or reports why it is still on the board. */
  async function archive() {
    setBusy(true);
    const { error } = await archiveTaskAction(groupUid, taskUid);
    setBusy(false);
    ask(false);

    // The panel stays open on the task, which the revalidated page redraws as
    // archived: there is nothing to navigate away from, unlike a delete.
    if (error) onError(error);
    else onDone(DONE);
  }

  if (!asking) {
    return (
      <Tooltip text="Archive task" place="above-end">
        <button type="button" onClick={() => ask(true)} aria-label="Archive task" className={PRESS}>
          <Archive className="size-5 shrink-0" aria-hidden />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="gap-space-sm flex w-full flex-col">
      {/* Neutral rather than red: the task and its rounds stay, so what the
          warning is about is that nothing brings it back onto the board. */}
      <p className="text-body-md text-muted-foreground">
        It leaves the board for good. Nothing brings it back.
      </p>

      <div className="gap-space-xs flex flex-wrap items-center justify-end">
        <button type="button" onClick={() => void archive()} disabled={busy} className={CONFIRM}>
          {busy ? (
            <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
          ) : (
            <Archive className="size-4 shrink-0" aria-hidden />
          )}
          Archive it
        </button>

        <button type="button" onClick={() => ask(false)} disabled={busy} className={CANCEL}>
          Keep
        </button>
      </div>
    </div>
  );
}
