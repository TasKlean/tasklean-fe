/**
 * Deleting a chore, which nothing brings back. It confirms in place, swapping
 * itself for the question rather than opening a dialog over a dialog.
 *
 * The press is an icon, where the question is worded: it sits in the reader's
 * footer beside Complete, and the row has no width for a second label.
 */

"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteTaskAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { Tooltip } from "@/components/common/tooltip/tooltip";

type DeleteTaskProps = {
  groupUid: string;
  taskUid: string;
  // Where the panel goes once the chore it was showing is gone.
  closeHref: string;
  // Reports the question, which the footer makes room for by taking its other
  // presses away.
  onAsking: (asking: boolean) => void;
  onError: (message: string) => void;
};

const PRESS =
  "border-destructive/40 text-destructive hover:bg-destructive-subtle focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none";

const CONFIRM =
  "bg-destructive text-destructive-foreground focus-visible:ring-ring text-label-md gap-space-xs px-space-sm flex min-h-11 shrink-0 items-center rounded-full disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const CANCEL =
  "text-label-md text-muted-foreground hover:text-foreground px-space-sm flex min-h-11 shrink-0 items-center rounded-full";

/** Renders the delete press and the question it turns into. */
export function DeleteTask({
  groupUid,
  taskUid,
  closeHref,
  onAsking,
  onError,
}: Readonly<DeleteTaskProps>) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  /** Opens or closes the question, telling the footer either way. */
  function ask(next: boolean) {
    setAsking(next);
    onAsking(next);
  }

  /** Deletes the chore and leaves the panel, or reports why it did not. */
  async function remove() {
    setBusy(true);
    const { error } = await deleteTaskAction(groupUid, taskUid);
    setBusy(false);

    if (error) {
      ask(false);
      onError(error);
      return;
    }

    router.push(closeHref);
  }

  if (!asking) {
    return (
      <Tooltip text="Delete task" place="above-end">
        <button type="button" onClick={() => ask(true)} aria-label="Delete task" className={PRESS}>
          <Trash2 className="size-5 shrink-0" aria-hidden />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="gap-space-xs flex flex-1 items-center justify-end">
      <button type="button" onClick={() => void remove()} disabled={busy} className={CONFIRM}>
        {busy ? (
          <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-4 shrink-0" aria-hidden />
        )}
        Delete for good
      </button>

      <button type="button" onClick={() => ask(false)} disabled={busy} className={CANCEL}>
        Keep
      </button>
    </div>
  );
}
