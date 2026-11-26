/**
 * A name on one line, with the whole of it a press away: a group's in its card,
 * a task's in the panel. The ellipsis is the only affordance it needs, and CSS
 * draws that one exactly when the name overflows, so nothing here measures the
 * text or counts its characters the way a description's clamp has to.
 */

"use client";

import { useState } from "react";

type ClippedNameProps = {
  name: string;
  // The type token and the placement, both of which the screen around it
  // decides: this one owns the clipping and nothing else.
  className?: string;
};

/** Renders a name, clipped to one line until it is pressed. */
export function ClippedName({ name, className = "" }: Readonly<ClippedNameProps>) {
  const [whole, setWhole] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setWhole(!whole)}
      aria-expanded={whole}
      // `truncate` overflows a block box and a button is not one; the padding is
      // a target, taking a 32px line to the 44 a finger needs, not spacing.
      className={`focus-visible:ring-ring block max-w-full rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none pointer-coarse:py-1.5 ${whole ? "break-words" : "truncate"} ${className}`}
    >
      {name}
    </button>
  );
}
