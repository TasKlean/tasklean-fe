/**
 * The chore's own words, cut off until the reader asks for the rest. The cap
 * is for reading only: nothing is lost, and the press says what it will do.
 */

"use client";

import { useState } from "react";

type DescriptionBlockProps = {
  text: string;
};

// Roughly four lines at the panel's width, which is as much as reads as a
// summary before it becomes the page.
const CAP = 260;

const TEXT = "text-body-md text-foreground whitespace-pre-line";

const MORE =
  "text-label-md text-foreground focus-visible:ring-ring w-fit rounded-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none";

/** Renders the description, with a way to see all of it. */
export function DescriptionBlock({ text }: Readonly<DescriptionBlockProps>) {
  const [open, setOpen] = useState(false);
  const long = text.length > CAP;

  return (
    <div className="gap-space-xs flex flex-col">
      <p className={TEXT}>{long && !open ? `${text.slice(0, CAP).trimEnd()}...` : text}</p>

      {long ? (
        <button type="button" onClick={() => setOpen(!open)} className={MORE}>
          {open ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
