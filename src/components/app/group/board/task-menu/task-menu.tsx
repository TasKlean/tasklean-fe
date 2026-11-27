/**
 * What a reader can do to a row's task without reading it first: open it,
 * edit it, delete it. The three dots are a desktop control and a long press
 * opens the same menu on a phone, which has no width for one per row. A card
 * has `CardMenu` of its own, drawn in another place and offering less.
 *
 * The panel hangs under whichever of the two opened it, and above it where
 * the screen has no room below, which is measured as it opens.
 *
 * Edit is a link, not a press: the editor belongs to the panel, which a row
 * cannot reach, so the URL is what carries the request across the navigation.
 */

"use client";

import { Eye, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteTaskAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import type { TaskMenuProps } from "@/components/app/group/board/task-menu/task-menu.types";

// A quiet circle, hidden rather than shrunk on a phone, where the long press
// replaces it. Nothing is lost: the open task carries Edit and Delete of its
// own, which is the way anybody not holding a finger down still reaches them.
const TRIGGER =
  "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring hidden size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex";

// Worn while the panel is open, so the press that opened it still looks
// pressed: a hover does not survive the press that moved focus into a panel,
// and on a touch screen there was never one to begin with.
const TRIGGER_ON = "bg-muted text-foreground";

// Hung off whatever is positioned around it: the three dots where they are
// drawn, and the row itself on a phone, which is where the hold that opened
// it was. Right-aligned to that, and never wider than the screen.
const PANEL =
  "bg-card border-border/60 shadow-level-3 p-space-xs gap-space-xs absolute right-0 z-30 flex w-max min-w-44 max-w-[calc(100vw-2rem)] flex-col rounded-xl border";

const HANGS = { down: "top-full mt-1", up: "bottom-full mb-1" };

// What the panel wants under it before it hangs downwards: its own three
// rows, the band the phone's bar reserves and a margin.
const ROOM = 220;

const ITEM =
  "text-label-md gap-space-sm px-space-sm text-foreground hover:bg-muted flex min-h-11 w-full items-center rounded-lg text-left transition-colors";

const DANGER = "text-destructive hover:bg-destructive-subtle";

const CONFIRM =
  "bg-destructive text-destructive-foreground focus-visible:ring-ring text-label-md gap-space-xs px-space-sm flex min-h-11 w-full items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const QUESTION = "text-label-sm text-muted-foreground px-space-sm pt-1";

const ICON = "size-4 shrink-0";

/** Renders the row's own menu, and the question deleting turns it into. */
export function TaskMenu({ actions, menu }: Readonly<TaskMenuProps>) {
  const { groupUid, taskUid, name, viewHref, editHref, canEdit } = actions;
  const { open, toggle, close, root, trigger } = menu;
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [up, setUp] = useState(false);

  // Measured off the wrapper rather than the press, because on a phone the
  // press is not drawn and the panel hangs off the row instead.
  const place = useCallback(() => {
    const box = root.current?.getBoundingClientRect();
    if (box) setUp(window.innerHeight - box.bottom < ROOM);
  }, [root]);

  // The hold on the row opens the menu without going through the press, so
  // the placement is settled here too. The press settles it before the panel
  // is drawn, which is what keeps that one from being placed twice.
  useEffect(() => {
    if (open) place();
  }, [open, place]);

  /** Deletes the task, or reports why it is still there. */
  async function remove() {
    setBusy(true);
    const answer = await deleteTaskAction(groupUid, taskUid);

    // Nothing to navigate to on a success: the action revalidates the board,
    // so the row this menu hangs off goes away with it.
    if (!answer.error) return;

    setBusy(false);
    setAsking(false);
    setError(answer.error);
  }

  return (
    // Positioned where the panel hangs off it, and raised while that panel is
    // open: the next row's own menu sits at the same level and later in the
    // document, so at `z-10` it painted over the one hanging below this row.
    <div ref={root} className={`sm:relative ${open ? "z-30" : "z-10"}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`More for ${name}`}
        onClick={() => {
          place();
          toggle();
        }}
        className={`${TRIGGER} ${open ? TRIGGER_ON : ""}`}
      >
        <MoreVertical className={ICON} aria-hidden />
      </button>

      {open ? (
        <div className={`${PANEL} ${up ? HANGS.up : HANGS.down}`}>
          {asking ? (
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
                onClick={() => setAsking(false)}
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

              {canEdit ? (
                <>
                  <Link href={editHref} onClick={close} className={ITEM}>
                    <Pencil className={ICON} aria-hidden />
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAsking(true)}
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
