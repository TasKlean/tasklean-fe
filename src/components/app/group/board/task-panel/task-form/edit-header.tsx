/**
 * The top bar of a chore being changed: what it is, who wrote it down, and the
 * two ways out, which are to throw the changes away or to keep them.
 *
 * The words are exported because the panel's own name and the footer's press
 * read them from here rather than saying them again.
 */

import type { MouseEventHandler } from "react";
import { BAR_SUBMIT } from "@/components/app/group/board/task-panel/task-form/task-form.styles";

type EditHeaderProps = {
  // Who wrote the chore down and when, which is the one fact the editor keeps
  // from the panel it replaced.
  byline: string | null;
  // The form these presses submit, which sits below this bar rather than
  // around it.
  formId: string;
  saving: boolean;
  onDiscard: MouseEventHandler<HTMLButtonElement>;
};

const DISCARD =
  "text-label-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring px-space-sm flex min-h-9 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

// The form's own words, read by the panel's name and the footer's press too.
export const EDIT_HEADING = "Edit task";

export const EDIT_SUBMIT = "Save changes";

/** Renders the editor's own top bar: what it is, and the two ways out of it. */
export function EditHeader({ byline, formId, saving, onDiscard }: Readonly<EditHeaderProps>) {
  return (
    <div className="gap-space-sm flex min-w-0 flex-1 items-center justify-between">
      <div className="min-w-0">
        <h2 className="text-label-lg text-foreground truncate">{EDIT_HEADING}</h2>

        {byline ? <p className="text-label-sm text-muted-foreground truncate">{byline}</p> : null}
      </div>

      <div className="gap-space-xs flex shrink-0 items-center">
        <button type="button" onClick={onDiscard} className={DISCARD}>
          Discard
        </button>

        <button type="submit" form={formId} disabled={saving} className={BAR_SUBMIT}>
          {saving ? "Saving..." : EDIT_SUBMIT}
        </button>
      </div>
    </div>
  );
}
