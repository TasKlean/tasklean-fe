/**
 * What a hover bubble is painted like, shared by `Tooltip` and `InfoTip`.
 *
 * Opacity rather than `display`, so a bubble a control is described by stays in
 * the document while it is hidden, and one property is set in one place rather
 * than two utilities settling it in the stylesheet.
 */

// Raised over a stretched link's `after:inset-0`, which otherwise takes every
// pointer on the row, and `pointer-fine` so a touch screen keeps its targets.
const ANCHOR = "group/tip pointer-fine:relative pointer-fine:z-10 inline-flex";

// How the anchor takes its width, which is the wrapped child's business.
export const TIP_WIDTH = {
  fit: `${ANCHOR} shrink-0`,
  shrink: `${ANCHOR} min-w-0`,
  fill: `${ANCHOR} w-full min-w-0`,
} as const;

export type TipWidth = keyof typeof TIP_WIDTH;

const BUBBLE =
  "text-label-sm bg-popover text-popover-foreground border-border/60 shadow-level-2 pointer-events-none absolute z-40 w-max max-w-56 rounded-md border px-2 py-1 transition-opacity";

// `pointer-fine` rather than hiding it on a touch screen: a tap counts as a
// hover there, which would leave a bubble sitting over the row it was tapped on.
const ON_HOVER = "pointer-fine:group-hover/tip:opacity-100";

// A bubble beside a press, revealed by that press alone rather than by the
// whole row it shares. The button is the peer, so the bubble follows it.
const ON_PRESS_HOVER = "peer-focus-visible:opacity-100 pointer-fine:peer-hover:opacity-100";

export const TIP_QUIET = `${BUBBLE} opacity-0 ${ON_HOVER}`;

export const TIP_PEER = `${BUBBLE} opacity-0 ${ON_PRESS_HOVER}`;

export const TIP_SHOWN = `${BUBBLE} opacity-100`;

// A bubble names the edge it hangs from: `start` and `end` are for a child at
// one end of its row, where a centred one would hang off the page.
export const TIP_PLACE = {
  above: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  "above-start": "bottom-full left-0 mb-1.5",
  "above-end": "right-0 bottom-full mb-1.5",
  // Beside the words from `sm`, under them on a phone: measured, a 224px
  // bubble off the end of a heading runs out of a 360px screen.
  right: "top-full left-0 mt-1.5 sm:top-1/2 sm:left-full sm:mt-0 sm:ml-1.5 sm:-translate-y-1/2",
} as const;

export type TipPlace = keyof typeof TIP_PLACE;
