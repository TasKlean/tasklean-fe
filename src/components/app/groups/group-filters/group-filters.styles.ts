/** The classes the row's controls share, so a pill reads the same wherever it sits. */

export const PILL =
  "text-label-md gap-space-xs px-space-md border-border/60 bg-card text-foreground hover:bg-muted flex min-h-11 w-full items-center justify-center rounded-full border transition-colors sm:w-auto";

// No horizontal anchor: a panel 240px wide hanging off the right edge of the
// left-hand pill starts at -65px on a 360px screen, so each menu names its side.
export const PANEL =
  "bg-card border-border/60 shadow-level-3 py-space-xs absolute top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border";

export const ROW =
  "text-label-md gap-space-sm px-space-md hover:bg-muted flex min-h-11 w-full items-center transition-colors";

// What a pill wears while it is holding something back, which is how the row
// says a filter is on without a count nobody can read at a glance.
export const ACTIVE_PILL = `${PILL} bg-secondary text-secondary-foreground border-transparent`;
