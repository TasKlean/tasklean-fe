/**
 * The menu a card's three dots open: View, Claim, Archive and Delete, Edit
 * being a press of its own in the control beside it. It owns its disclosure,
 * a card having no long press to share one with, which is what `RowPress`
 * holds it for on a row. Deliberately not the row's menu wearing another look: the two are
 * drawn in different places and will drift, and the lane board to come will
 * open this one.
 *
 * The panel hangs under the press, and above it where the screen has no room
 * below, which is measured as it opens.
 */

"use client";

import { Archive, Eye, HandHelping, Loader2, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  archiveTaskAction,
  claimTaskAction,
  deleteTaskAction,
} from "@/app/(app)/app/groups/[uid]/actions/actions";
import { CARD_ACTION, CARD_FILL } from "@/components/app/group/board/board.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";

type CardMenuProps = {
  groupUid: string;
  taskUid: string;
  // The task's own name, which is what the press is announced as: a grid of
  // identical "More" buttons names nothing a reader could choose between.
  name: string;
  viewHref: string;
  // False where the task is not the reader's to change, leaving the menu with
  // View alone. UX only: the delete behind it handles its own 403.
  canEdit: boolean;
  // True where nobody holds the task and a round is open: taking one is every
  // member's, where editing it is the author's and an admin's.
  canClaim: boolean;
  // False where the task is archived already, or is not the reader's.
  canArchive: boolean;
};

const PANEL =
  "bg-card border-border/60 shadow-level-3 p-space-xs gap-space-xs absolute right-0 z-30 flex w-max min-w-44 max-w-[calc(100vw-2rem)] flex-col rounded-xl border";

const HANGS = { down: "top-full mt-1", up: "bottom-full mb-1" };

// What the panel wants under it before it hangs downwards: its own rows at
// their most, the band the phone's bar reserves and a margin.
const ROOM = 280;

const ITEM =
  "text-label-md gap-space-sm px-space-sm text-foreground hover:bg-muted flex min-h-11 w-full items-center rounded-lg text-left transition-colors";

const DANGER = "text-destructive hover:bg-destructive-subtle";

const CONFIRM =
  "bg-destructive text-destructive-foreground focus-visible:ring-ring text-label-md gap-space-xs px-space-sm flex min-h-11 w-full items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const QUESTION = "text-label-sm text-muted-foreground px-space-sm pt-1";

// Neutral rather than red: the task and its rounds stay, and all that is lost
// is its place on the board.
const RETIRE =
  "bg-secondary text-secondary-foreground focus-visible:ring-ring text-label-md gap-space-xs px-space-sm flex min-h-11 w-full items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const ICON = "size-4 shrink-0";

/** Renders the card's own menu press, and the questions it turns into. */
export function CardMenu({
  groupUid,
  taskUid,
  name,
  viewHref,
  canEdit,
  canClaim,
  canArchive,
}: Readonly<CardMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  // Which question is up, rather than whether one is: both of them ask in the
  // panel's own body, so only one may hold it.
  const [asking, setAsking] = useState<"archive" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [up, setUp] = useState(false);

  useEffect(() => {
    if (!open) return;

    const box = root.current?.getBoundingClientRect();
    if (box) setUp(window.innerHeight - box.bottom < ROOM);
  }, [open, root]);

  /** Deletes the task, or reports why it is still there. */
  async function remove() {
    setBusy(true);
    const answer = await deleteTaskAction(groupUid, taskUid);

    // Nothing to navigate to on a success: the action revalidates the board,
    // so the card this menu hangs off goes away with it.
    if (!answer.error) return;

    setBusy(false);
    setAsking(null);
    setError(answer.error);
  }

  /** Retires the task, or reports why it is still on the board. */
  async function archive() {
    setBusy(true);
    const answer = await archiveTaskAction(groupUid, taskUid);

    // As with a delete, the revalidated board is what takes the card away:
    // under every filter but the one asking for archived tasks.
    if (!answer.error) return;

    setBusy(false);
    setAsking(null);
    setError(answer.error);
  }

  /** Takes the task, or reports why somebody else has it. */
  async function claim() {
    setBusy(true);
    const answer = await claimTaskAction(groupUid, taskUid);
    setBusy(false);

    if (answer.error) setError(answer.error);
    else close();
  }

  return (
    // Raised while the panel is open: the next card's own menu sits at the
    // same level and later in the document, so at `z-10` it painted over the
    // one hanging below this card.
    <div ref={root} className={`relative ${open ? "z-30" : "z-10"}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`More for ${name}`}
        onClick={toggle}
        className={`${CARD_ACTION} ${open ? CARD_FILL.on : CARD_FILL.off}`}
      >
        <MoreVertical className={ICON} aria-hidden />
      </button>

      {open ? (
        <div className={`${PANEL} ${up ? HANGS.up : HANGS.down}`}>
          {asking === "delete" ? (
            <>
              <p className={QUESTION}>Delete this task? Nothing brings it back.</p>

              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy}
                className={CONFIRM}
              >
                {busy ? (
                  <Loader2 className={`${ICON} motion-safe:animate-spin`} aria-hidden />
                ) : (
                  <Trash2 className={ICON} aria-hidden />
                )}
                Delete for good
              </button>

              <button
                type="button"
                onClick={() => setAsking(null)}
                disabled={busy}
                className={ITEM}
              >
                Keep it
              </button>
            </>
          ) : asking === "archive" ? (
            <>
              <p className={QUESTION}>Archive this task? It leaves the board for good.</p>

              <button
                type="button"
                onClick={() => void archive()}
                disabled={busy}
                className={RETIRE}
              >
                {busy ? (
                  <Loader2 className={`${ICON} motion-safe:animate-spin`} aria-hidden />
                ) : (
                  <Archive className={ICON} aria-hidden />
                )}
                Archive it
              </button>

              <button
                type="button"
                onClick={() => setAsking(null)}
                disabled={busy}
                className={ITEM}
              >
                Keep it
              </button>
            </>
          ) : (
            <>
              <Link href={viewHref} onClick={close} className={ITEM}>
                <Eye className={ICON} aria-hidden />
                View
              </Link>

              {canClaim ? (
                <button type="button" onClick={() => void claim()} disabled={busy} className={ITEM}>
                  {busy ? (
                    <Loader2 className={`${ICON} motion-safe:animate-spin`} aria-hidden />
                  ) : (
                    <HandHelping className={ICON} aria-hidden />
                  )}
                  Claim
                </button>
              ) : null}

              {canEdit ? (
                <>
                  {canArchive ? (
                    <button type="button" onClick={() => setAsking("archive")} className={ITEM}>
                      <Archive className={ICON} aria-hidden />
                      Archive
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setAsking("delete")}
                    className={`${ITEM} ${DANGER}`}
                  >
                    <Trash2 className={ICON} aria-hidden />
                    Delete
                  </button>
                </>
              ) : null}
            </>
          )}

          {error ? (
            <p role="alert" className="text-label-sm text-destructive px-space-sm pb-1">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
