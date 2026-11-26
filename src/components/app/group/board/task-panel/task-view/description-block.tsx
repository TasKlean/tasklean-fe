/**
 * The task's own words, cut off until the reader asks for the rest. The cap is
 * for reading only: nothing is lost, and the press says what it will do.
 *
 * The whole text is the control, a cut-off paragraph inviting a press on itself
 * where a link under it is easy to miss, and the words saying so sit at the end
 * of it rather than at the start of the next line.
 */

"use client";

import { useState } from "react";

type DescriptionBlockProps = {
  text: string;
};

// Roughly four lines at the panel's width, which is as much as reads as a
// summary before it becomes the page.
const CAP = 260;

const TEXT = "text-body-md text-foreground whitespace-pre-line wrap-anywhere";

const MORE = "text-label-md text-foreground underline underline-offset-2";

/** Renders the description, with a way to see all of it. */
export function DescriptionBlock({ text }: Readonly<DescriptionBlockProps>) {
  const [open, setOpen] = useState(false);
  const long = text.length > CAP;

  if (!long) return <p className={TEXT}>{text}</p>;

  return (
    // Spans rather than paragraphs: a button takes phrasing content only.
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className="gap-space-xs focus-visible:ring-ring flex flex-col rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className={TEXT}>{open ? text : `${text.slice(0, CAP).trimEnd()}...`}</span>

      <span className={`${MORE} self-end`}>{open ? "Read less" : "Read more"}</span>
    </button>
  );
}
