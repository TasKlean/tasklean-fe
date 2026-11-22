/** The paint a label row and its presses share, so a destructive one differs only where it means to. */

// A column, so a refusal sits under the label rather than in the row of
// presses beside it.
export const ROW =
  "py-space-sm gap-space-sm border-border/60 flex flex-col border-b last:border-b-0";

export const ROW_LINE = "gap-space-sm flex min-h-11 flex-wrap items-center";

// The presses at a row's end, which a phone drops under the label rather than
// squeezing beside it.
export const ROW_ACTIONS = "gap-space-xs ms-auto flex flex-wrap items-center";

export const ROW_ERROR = "text-label-sm text-destructive-subtle-foreground";

// The question a delete asks, which is a warning behind a destructive press and
// so wears `destructive` rather than the error fill's foreground.
export const CONFIRM_QUESTION = "text-label-sm px-space-xs text-destructive";

export const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const QUIET_BUTTON = `${BUTTON} border-border/60 text-muted-foreground hover:bg-muted`;

export const PRIMARY_BUTTON = `${BUTTON} bg-primary text-primary-foreground hover:bg-primary-strong border-transparent`;

export const DESTRUCTIVE_BUTTON = `${BUTTON} border-destructive/40 text-destructive hover:bg-destructive-subtle`;

export const CONFIRM_BUTTON = `${BUTTON} bg-destructive-subtle text-destructive-subtle-foreground hover:opacity-90 border-transparent`;

export const SPINNER = "size-4 motion-safe:animate-spin";

// What a section says in place of its list, which is prose rather than a
// failure: an empty list is the normal state of a household that just started.
export const EMPTY_NOTE = "text-body-md text-muted-foreground";

// The add form's own rule, which separates it from the list below it. It sits
// above the list rather than under it, so a long one is not scrolled past.
export const ADD_FORM = "pb-space-md border-border/60 flex flex-col border-b";

// A name is at most 100 characters, so a field spanning a desktop card is far
// wider than anything typed into it.
export const FORM_NAME = "sm:max-w-xs";

// The two pickers and the presses on one line, which they fit now that a
// picker is a single circle.
export const FORM_CONTROLS = "gap-space-sm flex flex-wrap items-center";

// Kept together, so a wrap takes both presses rather than splitting them.
export const FORM_PRESSES = "gap-space-xs flex flex-wrap items-center";
