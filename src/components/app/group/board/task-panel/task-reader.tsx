/**
 * The panel a task is read in: the shell, the presses it carries and the
 * facts between them.
 *
 * The view itself is a Server Component handed down as an element, since this
 * one holds the press that turns the panel into the editor.
 */

"use client";

import { Pencil } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { ArchiveTask } from "@/components/app/group/board/task-panel/archive-task";
import { CompleteButton } from "@/components/app/group/board/task-panel/complete-button/complete-button";
import { DeleteTask } from "@/components/app/group/board/task-panel/delete-task";
import type { PanelNotice } from "@/components/app/group/board/task-panel/task-panel.types";
import { FormNotice } from "@/components/common/form-notice";
import { SidePanel } from "@/components/common/side-panel/side-panel";
import { Tooltip } from "@/components/common/tooltip/tooltip";

type TaskReaderProps = {
  // The task's own name, which is what the panel is announced as.
  label: string;
  groupUid: string;
  // Absent only while there is no task to act on, which the board's own
  // delete leaves behind for the instant before the panel closes.
  taskUid?: string;
  closeHref: string;
  // A task asking for proof cannot be finished in one press, so both of these
  // lead to the view that takes a photo instead of recording a round.
  requiresProof: boolean;
  // False where there is nothing left to record: a one-off that is done draws
  // no Complete press at all, the Done pill above its name being what says so.
  canComplete: boolean;
  // Whose task it is, where that is not the reader: the press is then drawn
  // dead and says so, rather than leading to a refusal.
  heldBy: string | null;
  // The round already recorded, where the task has been done ahead of its
  // schedule and the next round is not open yet.
  doneFor: string | null;
  // False where there is no round to write off: one still ahead, and anything
  // with no round left at all.
  canSkip: boolean;
  // False where the task is already archived, or is not the reader's to
  // change. UX only, like every other gate here.
  canArchive: boolean;
  // False where the task is not the reader's to change, which hides editing
  // and deleting. Finishing one is every member's. UX only: each write handles
  // its own 403.
  canEdit: boolean;
  // What the last press said. The panel holds it, because the view that
  // records a round is gone by the time its line is read.
  notice: PanelNotice | null;
  onNotice: (notice: PanelNotice) => void;
  onEdit: () => void;
  onComplete: () => void;
  onSkip: () => void;
  children: ReactNode;
};

const KIND = "text-label-md text-muted-foreground truncate uppercase";

const FOOTER =
  "border-border/60 px-space-lg py-space-md gap-space-sm flex shrink-0 flex-col border-t";

// Icons rather than words: Complete is what the row is for and takes the
// width, and two more labels beside it do not fit a phone.
const EDIT =
  "border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none";

/** Renders the task's facts, with the ways to act on it above and below. */
export function TaskReader({
  label,
  groupUid,
  taskUid,
  closeHref,
  requiresProof,
  canComplete,
  heldBy,
  doneFor,
  canSkip,
  canArchive,
  canEdit,
  notice,
  onNotice,
  onEdit,
  onComplete,
  onSkip,
  children,
}: Readonly<TaskReaderProps>) {
  // Which question is up, rather than whether one is: the two of them take the
  // same row, so each has to stand aside for the other.
  const [asking, setAsking] = useState<"archive" | "delete" | null>(null);
  const [recording, setRecording] = useState(false);

  // Shared by the two presses, so whichever is pressed stops the other: two
  // rounds for one task is a refusal the reader never meant to see.
  const onBusy = useCallback((busy: boolean) => setRecording(busy), []);

  const header = (
    <div className="gap-space-sm flex min-w-0 flex-1 items-center justify-between">
      <span className={KIND}>Task details</span>

      {taskUid && canComplete ? (
        <CompleteButton
          size="sm"
          groupUid={groupUid}
          taskUid={taskUid}
          requiresProof={requiresProof}
          heldBy={heldBy}
          doneFor={doneFor}
          busy={recording}
          canSkip={canSkip}
          onBusy={onBusy}
          onDetails={onComplete}
          onSkip={onSkip}
          onNotice={onNotice}
        />
      ) : null}
    </div>
  );

  return (
    <SidePanel label={label} close={{ href: closeHref }} dismissable header={header}>
      {children}

      <div className={FOOTER}>
        {notice ? <FormNotice tone={notice.tone}>{notice.text}</FormNotice> : null}

        <div className="gap-space-sm flex items-center">
          {/* The question wants the whole row, so the presses it is about
              stand aside while it is up. */}
          {asking !== null ? null : (
            <>
              {taskUid && canComplete ? (
                <div className="flex min-w-0 flex-1">
                  <CompleteButton
                    size="lg"
                    groupUid={groupUid}
                    taskUid={taskUid}
                    requiresProof={requiresProof}
                    heldBy={heldBy}
                    doneFor={doneFor}
                    busy={recording}
                    canSkip={canSkip}
                    onBusy={onBusy}
                    onDetails={onComplete}
                    onSkip={onSkip}
                    onNotice={onNotice}
                  />
                </div>
              ) : null}

              {canEdit ? (
                <Tooltip text="Edit task" place="above-end">
                  <button type="button" onClick={onEdit} aria-label="Edit task" className={EDIT}>
                    <Pencil className="size-5 shrink-0" aria-hidden />
                  </button>
                </Tooltip>
              ) : null}
            </>
          )}

          {canArchive && taskUid && asking !== "delete" ? (
            <ArchiveTask
              groupUid={groupUid}
              taskUid={taskUid}
              onAsking={(open) => setAsking(open ? "archive" : null)}
              onDone={(text) => onNotice({ tone: "success", text })}
              onError={(text) => onNotice({ tone: "error", text })}
            />
          ) : null}

          {canEdit && taskUid && asking !== "archive" ? (
            <DeleteTask
              groupUid={groupUid}
              taskUid={taskUid}
              closeHref={closeHref}
              onAsking={(open) => setAsking(open ? "delete" : null)}
              onError={(text) => onNotice({ tone: "error", text })}
            />
          ) : null}
        </div>
      </div>
    </SidePanel>
  );
}
