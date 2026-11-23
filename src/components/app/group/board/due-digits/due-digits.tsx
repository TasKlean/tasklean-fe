/**
 * When a chore is due, at the head of its row: digits only, the column being
 * as narrow as a date, with the wording kept in the title. It is drawn like
 * the chore's own name, and the colour is what says one is late.
 */

import { DUE_INK } from "@/components/app/group/board/board.styles";
import type { DueLabel } from "@/lib/tasks/due/due";

type DueDigitsProps = {
  due: DueLabel;
};

/** Renders a chore's due date as numbers. */
export function DueDigits({ due }: Readonly<DueDigitsProps>) {
  return (
    <span className={`text-body-lg tabular-nums ${DUE_INK[due.tone]}`} title={due.title}>
      {due.text}
    </span>
  );
}
