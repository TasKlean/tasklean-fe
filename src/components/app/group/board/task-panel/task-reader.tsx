/**
 * The panel a chore is read in: the shell, the presses it carries and the
 * facts between them.
 *
 * The view itself is a Server Component handed down as an element, since this
 * one holds the press that turns the panel into the editor.
 */

"use client";

import { Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CompleteButton } from "@/components/app/group/board/task-panel/complete-button";
import { DeleteTask } from "@/components/app/group/board/task-panel/delete-task";
import { FormNotice } from "@/components/common/form-notice";
import { SidePanel } from "@/components/common/side-panel/side-panel";
import { Tooltip } from "@/components/common/tooltip/tooltip";

type TaskReaderProps = {
  // The chore's own name, which is what the panel is announced as.
  label: string;
  groupUid: string;
  // Absent only while there is no chore to act on, which the board's own
  // delete leaves behind for the instant before the panel closes.
  taskUid?: string;
  closeHref: string;
  // False where the chore is not the reader's to change, which hides both
  // presses. UX only: each write handles its own 403.
  canEdit: boolean;
  onEdit: () => void;
  children: ReactNode;
};

const KIND = "text-label-md text-muted-foreground truncate uppercase";

const FOOTER =
  "border-border/60 px-space-lg py-space-md gap-space-sm flex shrink-0 flex-col border-t";

// Icons rather than words: Complete is what the row is for and takes the
// width, and two more labels beside it do not fit a phone.
const EDIT =
  "border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none";

/** Renders the chore's facts, with the ways to act on it above and below. */
export function TaskReader({
  label,
  groupUid,
  taskUid,
  closeHref,
  canEdit,
  onEdit,
  children,
}: Readonly<TaskReaderProps>) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const header = (
    <div className="gap-space-sm flex min-w-0 flex-1 items-center justify-between">
      <span className={KIND}>Task details</span>

      <CompleteButton size="sm" />
    </div>
  );

  return (
    <SidePanel label={label} close={{ href: closeHref }} dismissable header={header}>
      {children}

      <div className={FOOTER}>
        {error ? <FormNotice tone="error">{error}</FormNotice> : null}

        <div className="gap-space-sm flex items-center">
          {/* The question wants the whole row, so the presses it is about
              stand aside while it is up. */}
          {asking ? null : (
            <>
              <div className="flex flex-1">
                <CompleteButton size="lg" />
              </div>

              {canEdit ? (
                <Tooltip text="Edit task" place="above-end">
                  <button type="button" onClick={onEdit} aria-label="Edit task" className={EDIT}>
                    <Pencil className="size-5 shrink-0" aria-hidden />
                  </button>
                </Tooltip>
              ) : null}
            </>
          )}

          {canEdit && taskUid ? (
            <DeleteTask
              groupUid={groupUid}
              taskUid={taskUid}
              closeHref={closeHref}
              onAsking={setAsking}
              onError={setError}
            />
          ) : null}
        </div>
      </div>
    </SidePanel>
  );
}
