/**
 * Finishing a task. One press records the round with nothing attached, which
 * is the common case and the accessible one: the backend snapshots the task's
 * own estimate, so a round nobody timed is never counted as zero.
 *
 * A form rather than a handler, so the simple path still works with no
 * JavaScript, and the same action the detailed view posts to.
 */

"use client";

import {
  CalendarCheck,
  Camera,
  ChevronUp,
  CircleCheck,
  Loader2,
  Lock,
  NotebookPen,
  SkipForward,
} from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import {
  completeTaskAction,
  type CompleteTaskState,
} from "@/app/(app)/app/groups/[uid]/actions/actions";
import type { PanelNotice } from "@/components/app/group/board/task-panel/task-panel.types";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";

type CompleteButtonProps = {
  // The header's is a pill beside the task's name; the footer's is the press
  // the panel exists for and takes the width.
  size: "sm" | "lg";
  groupUid: string;
  taskUid: string;
  // A task asking for proof has no one-press path at all: the backend refuses
  // a round with no photo, so the press opens the view that takes one.
  requiresProof: boolean;
  // The member a task is assigned to, where that is not the reader. The
  // endpoint refuses anybody but the assignee, so the press is drawn dead and
  // says whose task it is; null for one that is the reader's or nobody's.
  heldBy: string | null;
  // The round already recorded, worded, where the task has been done ahead of
  // its schedule: the backend takes the next one only once that round has
  // passed, so the press says so instead of refusing the work typed into it.
  doneFor: string | null;
  // True while the panel's other press is recording. The header and the footer
  // are two forms with two pending flags, so one has to be told about the
  // other or a quick pair of presses records two rounds.
  busy: boolean;
  // False where the round is still ahead, which the endpoint refuses to skip:
  // doing one early is work that happened, where skipping one early is a
  // statement about a round nobody could have missed yet.
  canSkip: boolean;
  onBusy: (busy: boolean) => void;
  onDetails: () => void;
  onSkip: () => void;
  onNotice: (notice: PanelNotice) => void;
};

const INITIAL: CompleteTaskState = { error: null, done: null };

// Grey, where the add-task press keeps its brand colour while disabled: that
// one waits on us to build something, where this is a task that is simply not
// the reader's to finish.
const HELD =
  "bg-muted text-muted-foreground gap-space-xs flex items-center justify-center rounded-full font-semibold disabled:cursor-not-allowed";

const SHELL =
  "bg-primary text-primary-foreground hover:bg-primary-strong gap-space-xs flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70";

const SIZES = {
  sm: "text-label-md min-h-9 px-space-sm",
  lg: "text-label-lg min-h-11 w-full px-space-md",
} as const;

// The two halves of one pill, so the choice reads as an extension of the press
// rather than as a second control beside it.
const SPLIT = "rounded-l-full";

const CHEVRON =
  "bg-primary text-primary-foreground hover:bg-primary-strong border-primary-foreground/25 focus-visible:ring-ring flex min-h-11 w-11 shrink-0 items-center justify-center rounded-r-full border-l transition-colors focus-visible:ring-2 focus-visible:outline-none";

// Hung above, the footer being the last thing on the page, and never wider
// than a phone.
const PANEL =
  "bg-card border-border/60 shadow-level-3 p-space-xs absolute right-0 bottom-full z-30 mb-2 flex w-max max-w-[calc(100vw-2rem)] flex-col rounded-xl border";

const ITEM =
  "text-label-md gap-space-sm px-space-sm text-foreground hover:bg-muted flex min-h-11 w-full items-center rounded-lg text-left transition-colors";

const ICON = "size-4 shrink-0";

/** Renders the press that records a round, and the way to the longer one. */
export function CompleteButton({
  size,
  groupUid,
  taskUid,
  requiresProof,
  heldBy,
  doneFor,
  busy,
  canSkip,
  onBusy,
  onDetails,
  onSkip,
  onNotice,
}: Readonly<CompleteButtonProps>) {
  const [state, act, pending] = useActionState(completeTaskAction, INITIAL);
  const { open, toggle, close, root, trigger } = useDisclosure();

  // The answer is reported once, where a render would report it again on every
  // keystroke anywhere else in the panel.
  const told = useRef<CompleteTaskState>(INITIAL);

  useEffect(() => {
    if (state === told.current) return;
    told.current = state;

    if (state.done) onNotice({ tone: "success", text: state.done });
    else if (state.error) onNotice({ tone: "error", text: state.error });
  }, [state, onNotice]);

  useEffect(() => {
    onBusy(pending);
  }, [pending, onBusy]);

  const recording = pending || busy;

  if (doneFor) {
    return (
      <button type="button" disabled className={`${HELD} ${SIZES[size]}`}>
        <CalendarCheck className={ICON} aria-hidden />
        <span className="truncate">Done for {doneFor}</span>
      </button>
    );
  }

  if (heldBy) {
    return (
      <button type="button" disabled className={`${HELD} ${SIZES[size]}`}>
        <Lock className={ICON} aria-hidden />
        <span className="truncate">Assigned to {heldBy}</span>
      </button>
    );
  }

  // A task asking for proof leads with the view the first row would open, so
  // only the skip is left to offer and the chevron goes with it.
  const ways = (requiresProof ? 0 : 1) + (canSkip ? 1 : 0);
  const split = size === "lg" && ways > 0;

  return (
    <div className={`flex items-stretch ${size === "lg" ? "w-full" : ""}`}>
      {requiresProof ? (
        <button
          type="button"
          onClick={onDetails}
          className={`${SHELL} ${SIZES[size]} ${split ? SPLIT : "rounded-full"}`}
        >
          <Camera className={ICON} aria-hidden />
          Complete with proof
        </button>
      ) : (
        <form action={act} className={size === "lg" ? "flex min-w-0 flex-1" : "flex"}>
          <input type="hidden" name="groupUid" value={groupUid} />
          <input type="hidden" name="taskUid" value={taskUid} />

          <button
            type="submit"
            disabled={recording}
            aria-busy={pending}
            className={`${SHELL} ${SIZES[size]} ${split ? SPLIT : "rounded-full"}`}
          >
            {pending ? (
              <Loader2 className={`${ICON} motion-safe:animate-spin`} aria-hidden />
            ) : (
              <CircleCheck className={ICON} aria-hidden />
            )}
            {pending ? "Recording..." : "Complete"}
          </button>
        </form>
      )}

      {split ? (
        <div ref={root} className="relative flex">
          <button
            ref={trigger}
            type="button"
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="Other ways to finish this round"
            onClick={toggle}
            className={CHEVRON}
          >
            <ChevronUp className={ICON} aria-hidden />
          </button>

          {open ? (
            <div className={PANEL}>
              {requiresProof ? null : (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onDetails();
                  }}
                  className={ITEM}
                >
                  <NotebookPen className={ICON} aria-hidden />
                  Complete with details
                </button>
              )}

              {canSkip ? (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onSkip();
                  }}
                  className={ITEM}
                >
                  <SkipForward className={ICON} aria-hidden />
                  Skip this round
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
