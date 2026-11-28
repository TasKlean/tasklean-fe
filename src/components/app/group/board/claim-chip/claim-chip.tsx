/**
 * Taking a task nobody holds, from the chip that says nobody holds it. The
 * pool is the one state a chip invites a press on, so the press is the chip
 * itself rather than a control beside it.
 *
 * Raised above the row's own stretched link, which takes every pointer over
 * the row: the cost is that the chip no longer opens the task, which is the
 * trade the menu's Claim row does not have to make.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { claimTaskAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { Tooltip } from "@/components/common/tooltip/tooltip";

type ClaimChipProps = {
  groupUid: string;
  taskUid: string;
  // The task's own name, so a board of identical chips names what each press
  // would take.
  name: string;
  // The circle alone until `sm`, as the chip it wraps draws it.
  compact?: boolean;
  // Which edge the refusal hangs from, since a chip at the right-hand end of
  // a card would otherwise push the bubble off the board.
  align?: "start" | "end";
};

const PRESS =
  "focus-visible:ring-ring flex max-w-full rounded-full transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const FAILURE =
  "bg-card border-border/60 shadow-level-3 text-label-sm text-destructive absolute top-full z-30 mt-1 w-max max-w-56 rounded-lg border p-2";

const EDGE = { start: "left-0", end: "right-0" } as const;

/** Renders the pool chip as the press that takes the task. */
export function ClaimChip({
  groupUid,
  taskUid,
  name,
  compact = false,
  align = "start",
}: Readonly<ClaimChipProps>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Takes the task, or says why somebody else has it. */
  async function claim() {
    setBusy(true);
    setError(null);
    const answer = await claimTaskAction(groupUid, taskUid);
    setBusy(false);

    // Nothing to do on a success: the action revalidates the board, so the
    // chip is redrawn with whoever now holds the task.
    if (answer.error) setError(answer.error);
  }

  return (
    <span className="relative z-10 flex max-w-full">
      <Tooltip text="Claim this task" place={align === "end" ? "above-end" : "above-start"}>
        <button
          type="button"
          onClick={() => void claim()}
          disabled={busy}
          aria-busy={busy}
          aria-label={`Claim ${name}`}
          className={PRESS}
        >
          {busy ? (
            <span className="flex size-8 items-center justify-center">
              <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
            </span>
          ) : (
            <AssigneeChip member={undefined} compact={compact} />
          )}
        </button>
      </Tooltip>

      {error ? (
        <span role="alert" className={`${FAILURE} ${EDGE[align]}`}>
          {error}
        </span>
      ) : null}
    </span>
  );
}
