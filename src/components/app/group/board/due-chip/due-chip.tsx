/**
 * When a chore is next due, named rather than dated for the nearest days. The
 * full date goes in the bubble over it, so a reader can still see which day
 * "tomorrow" is without doing the arithmetic.
 */

import { CalendarClock } from "lucide-react";
import { CHIP, DUE_TONE } from "@/components/app/group/board/board.styles";
import type { DueLabel } from "@/lib/tasks/due/due";

type DueChipProps = {
  due: DueLabel;
};

/** Renders a chore's due date. */
export function DueChip({ due }: Readonly<DueChipProps>) {
  return (
    <span className={`${CHIP} ${DUE_TONE[due.tone]}`}>
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      {due.text}
    </span>
  );
}
