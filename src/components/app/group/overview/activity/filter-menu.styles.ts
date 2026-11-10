/**
 * The paint every filter menu on this screen shares: the pill that opens one,
 * the panel it drops and the rows inside it. One file, because the panels are
 * the same box swapped for each other, so a row in any of them has to measure
 * the same.
 */

// Full width on a phone, where the two menus split the row between them, so a
// panel hangs off a gutter rather than off wherever the label happened to end.
export const TRIGGER =
  "text-label-md gap-space-xs px-space-md flex min-h-11 w-full min-w-0 items-center rounded-full border transition-colors sm:w-auto";

// Held to the trigger's own edge while it is full width, beside the label once
// it is not.
export const TRIGGER_ARROW = "ml-auto size-4 shrink-0 sm:ml-0";

export const TRIGGER_QUIET = "border-border/60 bg-card text-foreground hover:bg-muted";

// What the trigger wears while it is holding something back, which is how the
// row says a filter is on without a count nobody reads at a glance.
export const TRIGGER_ON = "bg-secondary text-secondary-foreground border-transparent";

// No horizontal anchor: a 256px panel hanging off the left edge of the
// right-hand pill runs off a 360px screen, so each menu names its own side.
export const PANEL =
  "bg-card border-border/60 shadow-level-3 py-space-xs absolute top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border";

export const ROW =
  "text-label-md gap-space-sm px-space-md flex min-h-11 w-full items-center transition-colors";

export const ROW_ON = "bg-muted text-foreground";

export const ROW_OFF = "text-muted-foreground hover:bg-muted hover:text-foreground";

// Square at the row's height, so the half that navigates and the half that
// opens the list are each a target of their own and neither is under 44px.
export const DRILL =
  "text-muted-foreground hover:bg-muted hover:text-foreground flex min-h-11 w-11 shrink-0 items-center justify-center transition-colors";

export const DIVIDER = "bg-border/60 my-space-xs h-px";
