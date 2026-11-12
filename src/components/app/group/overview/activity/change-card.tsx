/**
 * What an update moved, behind a press. Collapsed by default, because a feed is
 * read for what happened and the fields behind one line are detail a reader
 * asks for. The count is in the label, so they know whether it is worth asking.
 */

import { useState } from "react";
import { TokenLine } from "@/components/app/group/overview/activity/token-line";
import type { AuditToken } from "@/lib/audit/tokens/tokens";
import { tokenText } from "@/lib/audit/tokens/tokens";

type ChangeCardProps = {
  // One line per changed field, already worded and cut into its pieces.
  lines: AuditToken[][];
};

// No `aria-controls`: the list is not rendered while it is closed, and a
// reference to nothing is worse than none. The press sits right above it.
const TOGGLE =
  "text-label-sm text-muted-foreground hover:text-foreground self-start underline underline-offset-2 transition-colors";

/** Names the press by what it opens, so the count is read before the press. */
function showLabel(count: number): string {
  return `Show ${count} change${count === 1 ? "" : "s"}`;
}

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
        {shown ? "Hide changes" : showLabel(lines.length)}
      </button>

      {shown ? (
        // `w-fit`: the lines are short, and a card stretched to the row's end
        // reads as a panel rather than the aside it is.
        <ul className="bg-muted/40 border-border/60 divide-border/60 w-fit max-w-full divide-y rounded-lg border">
          {lines.map((line) => (
            <li
              key={tokenText(line)}
              className="text-label-md text-muted-foreground px-space-sm py-space-xs break-words"
            >
              <TokenLine tokens={line} />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
