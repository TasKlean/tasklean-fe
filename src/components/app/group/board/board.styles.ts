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

// The same three tones as words rather than as a fill, for a card, which
// spells the date out with no pill around it. The state is still said in the
// bubble and read out, so the colour is the glance and not the whole message.
export const DUE_WORDS: Record<DueTone, string> = {
  overdue: "text-destructive",
  soon: "text-warning",
  later: "text-muted-foreground",
};

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

// The presses over a card's picture are one control in two halves, Edit then
// the menu, which is what reads as a control on top of a photo where the
// row's quiet circles would disappear into it. The hair of padding keeps a
// half's own fill inside the shell's corners, which the shell cannot clip
// away: the menu's panel hangs out of it.
export const CARD_ACTIONS =
  "border-border/60 bg-card/85 gap-0.5 flex items-center rounded-md border p-0.5";

export const CARD_DIVIDER = "bg-border/60 h-5 w-px shrink-0";

// 32px a half, under the app's 44px floor as the filter panel's pills are,
// and the pair inside its shell measures 73 by 36.
export const CARD_ACTION =
  "text-foreground focus-visible:ring-ring flex size-8 shrink-0 items-center justify-center rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

// Written whole either way: a resting half and an open one both set a
// background, which two utilities in one class list would leave the
// stylesheet to settle.
export const CARD_FILL = { off: "hover:bg-muted", on: "bg-muted" } as const;

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
