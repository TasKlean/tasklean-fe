/**
 * What the chore form's own parts share. The panel is a fixed width, so these
 * are written once rather than per field.
 */

// Only the fields scroll; the save stays in reach at the foot of the panel.
// An `@container`, so a pair of half rows reads the panel rather than the
// window and stacks where a phone cannot hold two.
export const FIELDS =
  "px-space-lg py-space-md gap-space-md scrollbar-slim @container flex min-h-0 flex-1 flex-col overflow-y-auto";

export const FOOTER =
  "border-border/60 px-space-lg py-space-md gap-space-sm flex shrink-0 flex-col border-t";

// A pill in a row of choices, which carries its own focus ring because the
// input inside it is `sr-only`.
export const CHOICE =
  "text-label-md px-space-sm has-[:focus-visible]:ring-ring flex min-h-9 cursor-pointer items-center justify-center rounded-full border transition-colors has-[:focus-visible]:ring-2";

export const CHOICE_ON = "border-primary bg-primary text-primary-foreground";

export const CHOICE_OFF = "border-border/60 text-muted-foreground hover:bg-muted";

// A choice that is a label, wearing its own colour rather than the brand fill.
// `label-pill` deepens that colour when the radio inside it is checked, so
// there is no second class for the picked one.
export const CHOICE_LABEL = "label-pill text-foreground";

// A choice that sits in a track rather than on its own, so the chosen one
// reads as a pill that moved rather than as a button that lit up.
export const TRACK = "bg-muted gap-1 flex rounded-full p-1";

export const SEGMENT =
  "text-label-md has-[:focus-visible]:ring-ring flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-full transition-colors has-[:focus-visible]:ring-2";

export const SEGMENT_ON = "bg-primary text-primary-foreground";

export const SEGMENT_OFF = "text-muted-foreground hover:text-foreground";

// A bordered block holding a control and the words that explain it.
export const CARD = "border-border/60 gap-space-sm p-space-md flex items-center rounded-xl border";

// Two controls sharing a row where the panel is wide enough for them, and one
// above the other where it is not.
export const HALVES = "gap-space-sm grid grid-cols-1 items-start @sm:grid-cols-2";

// The fifth pill of the estimate row, which is a box rather than a press, so
// it carries the focus ring itself where CHOICE waits for a nested input.
export const CUSTOM_BOX =
  "text-label-md px-space-sm focus-visible:ring-ring min-h-9 w-full min-w-0 rounded-full border text-center transition-colors focus-visible:ring-2 focus-visible:outline-none";

// The save in the panel's top bar, which both forms carry and neither owns.
export const BAR_SUBMIT =
  "bg-primary text-primary-foreground hover:bg-primary-strong focus-visible:ring-ring text-label-md px-space-md flex min-h-9 shrink-0 items-center justify-center rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";
