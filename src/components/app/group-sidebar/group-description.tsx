/**
 * A group's description in its card, clamped to three lines with a way to see
 * the rest. The toggle appears by character count rather than by measuring the
 * rendered text: a measurement needs an effect and a second render, and the
 * cap is 500 characters, so three lines is a length the count can stand in for.
 */

"use client";

import { useState } from "react";

type GroupDescriptionProps = {
  description: string;
  // The rail hides this when it collapses, and the toggle has to go with it.
  away: string;
};

// Roughly what three lines hold in the rail, rounded down so the toggle never
// appears over text that was not clamped in the first place.
const CLAMP_AT = 150;

/** Renders a group's description, with a toggle once it is long enough to need one. */
export function GroupDescription({ description, away }: Readonly<GroupDescriptionProps>) {
  const [expanded, setExpanded] = useState(false);
  const long = description.length > CLAMP_AT;

  return (
    <div className={`gap-space-xs flex flex-col ${away}`}>
      <p
        className={`text-body-md text-muted-foreground max-w-prose ${long && !expanded ? "line-clamp-3" : ""}`}
      >
        {description}
      </p>

      {long ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="text-label-sm text-foreground hover:text-primary self-start underline underline-offset-2 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
