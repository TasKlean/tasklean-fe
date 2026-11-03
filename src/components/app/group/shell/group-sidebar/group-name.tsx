/**
 * A group's name on one line in its card, with the whole of it a press away.
 * The ellipsis is the only affordance it needs, and CSS draws that one exactly
 * when the name overflows, so nothing here measures the text or counts its
 * characters the way the description's clamp has to.
 */

"use client";

import { useState } from "react";

type GroupNameProps = {
  name: string;
  // The type token and the placement, both of which the card decides.
  className?: string;
};

/** Renders a group's name, clipped to one line until it is pressed. */
export function GroupName({ name, className = "" }: Readonly<GroupNameProps>) {
  const [whole, setWhole] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setWhole(!whole)}
      aria-expanded={whole}
      // `block` and `max-w-full`: `truncate` overflows a block box, and a
      // button is not one, so without them the name pushes the card wider.
      className={`focus-visible:ring-ring block max-w-full rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none ${whole ? "break-words" : "truncate"} ${className}`}
    >
      {name}
    </button>
  );
}
