/**
 * When a task is due, at the head of its row: digits only, the column being
 * as narrow as a date, with the wording in the bubble over it and in the text
 * a reader hears. The digits never change colour; a rule under them is what
 * says one is late or close.
 */

import { DUE_DIGITS, DUE_MARK, DUE_RULE } from "@/components/app/group/board/board.styles";
import type { DueLabel } from "@/lib/tasks/due/due";

type DueDigitsProps = {
  due: DueLabel;
};

/** Renders a task's due date as numbers, with its warning under them. */
export function DueDigits({ due }: Readonly<DueDigitsProps>) {
  const rule = DUE_RULE[due.tone];

  return (
    <span className={DUE_DIGITS}>
      <span className="sr-only">{due.title}</span>
      <span aria-hidden>{due.text}</span>

      {rule ? <span aria-hidden className={`${DUE_MARK} ${rule}`} /> : null}
    </span>
  );
}
