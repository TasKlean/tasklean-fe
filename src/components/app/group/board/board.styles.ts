/**
 * The paint the board's rows and controls share. One file, because a chip in a
 * row and the same chip in the open chore have to measure the same.
 */

import type { DueTone } from "@/lib/tasks/due/due";
import type { TaskPriority } from "@/lib/tasks/tasks/tasks.types";

export const CHIP = "text-label-sm gap-1 flex max-w-full items-center rounded-full px-2 py-0.5";

// Role tokens rather than a palette of its own: a priority is how loud the row
// should be, which is what these three already mean everywhere else.
export const PRIORITY_TONE: Record<TaskPriority, string> = {
  HIGH: "bg-destructive-subtle text-destructive-subtle-foreground",
  MEDIUM: "bg-warning-subtle text-warning-subtle-foreground",
  LOW: "bg-muted text-muted-foreground",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: "High priority",
  MEDIUM: "Medium priority",
  LOW: "Low priority",
};

export const DUE_TONE: Record<DueTone, string> = {
  overdue: "bg-destructive-subtle text-destructive-subtle-foreground",
  soon: "bg-warning-subtle text-warning-subtle-foreground",
  later: "bg-muted text-muted-foreground",
};

export const ROW =
  "bg-card border-border/60 p-space-md gap-space-sm hover:bg-muted/40 flex w-full items-start rounded-xl border text-left transition-colors";

export const ROW_TITLE = "text-title-sm text-foreground";

export const META = "gap-space-xs mt-1 flex flex-wrap items-center";
