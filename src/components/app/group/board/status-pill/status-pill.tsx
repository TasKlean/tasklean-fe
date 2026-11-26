/**
 * Where a task has got to, as a pill. Toned and marked per status, so a board
 * reads as states rather than as a column of identical grey, and the same pill
 * is drawn on a row and in the open task.
 *
 * Shorter than the round's own `OutcomePill`: this one sits in a row beside
 * the other pills and has to measure like them.
 */

import { Archive, Circle, CircleCheck, CircleDashed } from "lucide-react";
import { statusLabel } from "@/lib/tasks/status/status";

type StatusPillProps = {
  status: string | undefined;
  // The icon alone until `sm`, for a row on a phone, which has no width for a
  // state beside the task's own name. The words are still read out.
  compact?: boolean;
};

const PILL = "text-label-sm-strong gap-1 flex shrink-0 items-center rounded-full whitespace-nowrap";

// A circle on a phone row, where the pill is its icon alone: padding on a box
// with nothing in it but a 14px mark makes an oval rather than a dot.
const ROOM = {
  full: "px-1.5 py-0.5",
  tight: "size-6 justify-center sm:size-auto sm:px-1.5 sm:py-0.5",
} as const;

// Role tokens: `secondary` is DESIGN.md's own blue container, the one tint on
// the palette that is a fill rather than text.
const TONE: Record<string, string> = {
  TODO: "bg-secondary text-secondary-foreground",
  COMPLETED: "bg-success-subtle text-success-subtle-foreground",
};

// Archived, in progress and anything a later backend adds.
const QUIET = "bg-muted text-muted-foreground";

const ICON = "size-3.5 shrink-0";

/** Renders where a task has got to. */
export function StatusPill({ status, compact = false }: Readonly<StatusPillProps>) {
  const tone = status ? (TONE[status] ?? QUIET) : QUIET;

  return (
    <span className={`${PILL} ${compact ? ROOM.tight : ROOM.full} ${tone}`}>
      {status === "COMPLETED" ? (
        <CircleCheck className={ICON} aria-hidden />
      ) : status === "TODO" ? (
        <CircleDashed className={ICON} aria-hidden />
      ) : status === "ARCHIVED" ? (
        <Archive className={ICON} aria-hidden />
      ) : (
        <Circle className={ICON} aria-hidden />
      )}
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>{statusLabel(status)}</span>
    </span>
  );
}
