/**
 * What an update moved, behind a press. Collapsed by default, because a feed is
 * read for what happened and the fields behind one line are detail a reader
 * asks for. The count is in the label, so they know whether it is worth asking.
 */

import { useState } from "react";

type ChangeCardProps = {
  // One phrase per changed field, already worded.
  lines: string[];
};

// No `aria-controls`: the list is not rendered while it is closed, and a
// reference to nothing is worse than none. The press sits right above it.
const TOGGLE =
  "text-label-sm text-muted-foreground hover:text-foreground self-start underline underline-offset-2 transition-colors";

/** Renders the fields an update moved, once the reader asks for them. */
export function ChangeCard({ lines }: Readonly<ChangeCardProps>) {
  const [shown, setShown] = useState(false);

  if (lines.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShown(!shown)}
        aria-expanded={shown}
        className={TOGGLE}
      >
        {shown ? "Hide changes" : `Show ${lines.length} change${lines.length === 1 ? "" : "s"}`}
      </button>

      {shown ? (
        <ul className="bg-card border-border/60 p-space-sm gap-space-xs flex flex-col rounded-lg border">
          {lines.map((line) => (
            <li key={line} className="text-label-md text-muted-foreground break-words">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
