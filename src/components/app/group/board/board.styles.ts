/**
 * The paint the board's rows and controls share. One file, because a chip in a
 * row and the same chip in the open task have to measure the same.
 */

import type { DueTone } from "@/lib/tasks/due/due";
import type { TaskPriority } from "@/lib/tasks/tasks/tasks.types";

export const CHIP =
  "text-label-sm gap-1 flex max-w-full shrink-0 items-center rounded-full px-2 py-0.5 whitespace-nowrap";

// Role tokens rather than a palette of its own: a priority is how loud the row
// should be, and the solid tone rather than the tint, so it reads before the
// words beside it. Low wears `accent`, the palette's own sky-blue wash, which
// is quiet without reading as the grey a row uses for everything unset.
export const PRIORITY_TONE: Record<TaskPriority, string> = {
  HIGH: "bg-destructive text-destructive-foreground",
  MEDIUM: "bg-warning text-warning-foreground",
  LOW: "bg-accent text-accent-foreground",
};

// Squarer and tighter than every other chip on the row, which is what tells a
// priority apart from a category or a tag at a glance.
export const PRIORITY_CHIP =
  "text-label-sm flex shrink-0 items-center rounded-sm px-1.5 py-0.5 whitespace-nowrap";

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

// The date at the head of a row, which reads in the name's own colour whatever
// it says: the warning is a rule under it instead, so a column of dates reads
// as dates and the ones that matter are marked rather than recoloured.
export const DUE_DIGITS =
  "text-body-lg-strong text-foreground tabular-nums inline-flex flex-col items-center gap-0.5";

export const DUE_MARK = "h-0.5 w-full rounded-full";

// Empty for a date nothing is urgent about, which draws no rule at all.
export const DUE_RULE: Record<DueTone, string> = {
  overdue: "bg-destructive",
  soon: "bg-warning",
  later: "",
};

// A grid rather than a flex row: the pills ride beside the name on a wide
// screen and drop under it on a phone, and one tree has to draw both. The
// fourth column is the menu, which a phone does not show at all.
export const ROW =
  "bg-card border-border/60 p-space-md gap-x-space-sm gap-y-1 hover:bg-muted/40 has-[a:focus-visible]:ring-ring relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start rounded-xl border transition-colors select-none has-[a:focus-visible]:ring-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:select-text";

// A fixed width, so every name on the board starts on one line whatever its
// date reads and a task with no date keeps the space. Centred down the row,
// since it answers for both of its lines rather than for the name alone.
export const ROW_DUE = "col-start-1 row-span-2 row-start-1 w-14 shrink-0 self-center text-center";

export const ROW_TITLE = "text-body-lg-strong text-foreground";

// What the name and the pills sit in. The link is stretched over the whole
// row by `after:inset-0`, so the press is the row and the menu beside it is
// still its own control.
export const ROW_MAIN =
  "gap-x-space-xs gap-y-1 col-start-2 row-start-1 flex min-w-0 flex-wrap items-center after:absolute after:inset-0 sm:flex-nowrap";

// The assignee and the menu, centred down the row beside the date rather
// than pinned to the line with the name on it.
export const ROW_SIDE =
  "col-start-3 row-span-2 row-start-1 flex items-center gap-1 self-center justify-self-end";

// Where the menu's own press sits, which is a column of its own only where
// it is drawn. On a phone it is a press nobody can see, so it is left to
// land wherever the grid has a gap, and it takes up none of it.
export const ROW_MENU = "sm:col-start-4 sm:row-span-2 sm:row-start-1 sm:self-center";

// The quiet line under the name, which a phone has no room for: its marks
// ride with the pills there instead.
export const ROW_META =
  "gap-space-sm col-start-2 row-start-2 hidden flex-wrap items-center sm:flex";
