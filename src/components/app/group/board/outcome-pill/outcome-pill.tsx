/**
 * What became of one round: done, skipped or missed. The same pill wherever a
 * round is drawn, so a row in the history and the round it opens cannot say
 * the same thing two ways.
 *
 * Toned by outcome rather than drawn alike, a missed round being a different
 * kind of fact from a finished one.
 */

import { CircleAlert, CircleCheck, CircleSlash } from "lucide-react";
import { outcomeLabel } from "@/lib/tasks/completions/completions.helpers";
import type { TaskOutcome } from "@/lib/tasks/completions/completions.types";

type OutcomePillProps = {
  outcome: TaskOutcome | undefined;
};

const PILL =
  "text-label-md gap-space-xs px-space-sm flex min-h-8 w-fit shrink-0 items-center rounded-full whitespace-nowrap";

// Role tokens, like every other pill on the board: the `*-subtle-foreground`
// pair is the one that flips with the scheme.
const TONE: Record<string, string> = {
  SKIPPED: "bg-muted text-muted-foreground",
  MISSED: "bg-destructive-subtle text-destructive-subtle-foreground",
};

const DONE = "bg-success-subtle text-success-subtle-foreground";

const ICON = "size-4 shrink-0";

/** Renders one round's outcome as a pill. */
export function OutcomePill({ outcome }: Readonly<OutcomePillProps>) {
  const tone = outcome ? (TONE[outcome] ?? DONE) : DONE;

  return (
    <span className={`${PILL} ${tone}`}>
      {outcome === "MISSED" ? (
        <CircleAlert className={ICON} aria-hidden />
      ) : outcome === "SKIPPED" ? (
        <CircleSlash className={ICON} aria-hidden />
      ) : (
        <CircleCheck className={ICON} aria-hidden />
      )}
      {outcomeLabel(outcome)}
    </span>
  );
}
