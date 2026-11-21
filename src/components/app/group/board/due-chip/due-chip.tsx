/**
 * When a chore is next due, named rather than dated for the nearest days. The
 * full date stays in the title, so a reader can still see which day "tomorrow"
 * is without doing the arithmetic.
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
    <span className={`${CHIP} ${DUE_TONE[due.tone]}`} title={due.title}>
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      {due.text}
    </span>
  );
}
