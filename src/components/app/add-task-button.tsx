/**
 * The one thing the header offers rather than navigates to. Tasks are not
 * built, so this is the real control disabled rather than a gap where a button
 * will appear, and it says so when asked.
 *
 * A phone does not get it: the header there is the brand, the group and the
 * account, and a fourth control crowds all three.
 */

import { Plus } from "lucide-react";

/** Renders the add-task control. */
export function AddTaskButton() {
  return (
    <button
      type="button"
      disabled
      aria-label="Add task, coming soon"
      className="border-border/60 text-muted-foreground/70 gap-space-xs px-space-sm hidden min-h-11 min-w-11 items-center justify-center rounded-full border disabled:cursor-not-allowed sm:flex"
    >
      <Plus className="size-5 shrink-0" aria-hidden />
      <span className="text-label-lg hidden sm:inline">Add task</span>
    </button>
  );
}
