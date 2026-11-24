/**
 * A chore's priority, as a chip. Low is drawn too: an unmarked row would read
 * as a chore with no priority set, which the backend does not allow.
 */

import { CHIP, PRIORITY_LABEL, PRIORITY_TONE } from "@/components/app/group/board/board.styles";
import type { TaskPriority } from "@/lib/tasks/tasks/tasks.types";

type PriorityMarkProps = {
  priority: TaskPriority;
};

const SHORT: Record<TaskPriority, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

/** Renders one chore's priority. */
export function PriorityMark({ priority }: Readonly<PriorityMarkProps>) {
  return (
    <span className={`${CHIP} ${PRIORITY_TONE[priority]}`}>
      <span className="sr-only">{PRIORITY_LABEL[priority]}</span>
      <span aria-hidden>{SHORT[priority]}</span>
    </span>
  );
}
