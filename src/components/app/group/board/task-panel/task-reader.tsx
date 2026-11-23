/**
 * The panel a chore is read in: the shell, the two presses it carries and the
 * facts between them.
 *
 * The view itself is a Server Component handed down as an element, since this
 * one holds the press that turns the panel into the editor.
 */

"use client";

import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { CompleteButton } from "@/components/app/group/board/task-panel/complete-button";
import { SidePanel } from "@/components/common/side-panel/side-panel";

type TaskReaderProps = {
  // The chore's own name, which is what the panel is announced as.
  label: string;
  closeHref: string;
  // False where the chore is not the reader's to change, which hides both
  // presses. UX only: the save handles its own 403.
  canEdit: boolean;
  onEdit: () => void;
  children: ReactNode;
};

const KIND = "text-label-md text-muted-foreground truncate uppercase";

const EDIT =
  "text-label-md text-foreground hover:bg-muted focus-visible:ring-ring gap-space-xs px-space-sm flex min-h-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

const FOOTER = "border-border/60 px-space-lg py-space-md gap-space-sm flex shrink-0 border-t";

const FOOTER_EDIT =
  "border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring gap-space-xs text-label-lg flex min-h-11 flex-1 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none";

/** Renders the chore's facts, with the ways to act on it above and below. */
export function TaskReader({
  label,
  closeHref,
  canEdit,
  onEdit,
  children,
}: Readonly<TaskReaderProps>) {
  const header = (
    <div className="gap-space-sm flex min-w-0 flex-1 items-center justify-between">
      <span className={KIND}>Task details</span>

      <div className="gap-space-xs flex shrink-0 items-center">
        <CompleteButton size="sm" />

        {canEdit ? (
          <button type="button" onClick={onEdit} className={EDIT}>
            <Pencil className="size-4 shrink-0" aria-hidden />
            Edit
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <SidePanel label={label} close={{ href: closeHref }} dismissable header={header}>
      {children}

      <div className={FOOTER}>
        {/* Three quarters to one: finishing the chore is what the reader came
            to do, where changing it is the occasional press. */}
        <div className="flex flex-3">
          <CompleteButton size="lg" />
        </div>

        {canEdit ? (
          <button type="button" onClick={onEdit} className={FOOTER_EDIT}>
            <Pencil className="size-4 shrink-0" aria-hidden />
            Edit
          </button>
        ) : null}
      </div>
    </SidePanel>
  );
}
