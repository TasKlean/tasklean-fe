/**
 * A group's description in its card, clamped to three lines with a way to see
 * the rest. The whole text is the control, since a three-line clamp invites a
 * press on the text itself and a link beside it is easy to miss. The toggle
 * appears by character count rather than by measuring the rendered text: a
 * measurement needs an effect and a second render, and the cap is 500
 * characters, so three lines is a length the count can stand in for.
 */

"use client";

import { useState } from "react";

type GroupDescriptionProps = {
  description: string;
  // The display classes that decide where this is drawn, which the rail owns:
  // it has three states to hide in and only one to appear in, so a `flex` of
  // our own would fight whatever it was told.
  shown: string;
};

// Roughly what three lines hold in the rail, rounded down so the toggle never
// appears over text that was not clamped in the first place.
const CLAMP_AT = 150;

const TEXT = "text-body-md text-muted-foreground max-w-prose";

/** Renders a group's description, with a toggle once it is long enough to need one. */
export function GroupDescription({ description, shown }: Readonly<GroupDescriptionProps>) {
  const [expanded, setExpanded] = useState(false);

  if (description.length <= CLAMP_AT) {
    return (
      <div className={`gap-space-xs flex-col ${shown}`}>
        <p className={TEXT}>{description}</p>
      </div>
    );
  }

  return (
    // Spans rather than a paragraph: a button takes phrasing content only.
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
      className={`gap-space-xs flex-col text-left ${shown}`}
    >
      <span className={`${TEXT} ${expanded ? "" : "line-clamp-3"}`}>{description}</span>

      <span className="text-label-sm text-foreground underline underline-offset-2">
        {expanded ? "Show less" : "Read more"}
      </span>
    </button>
  );
}
