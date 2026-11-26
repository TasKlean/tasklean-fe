/**
 * A task's priority, as a chip. Low is drawn too: an unmarked row would read
 * as a task with no priority set, which the backend does not allow.
 */

import {
  PRIORITY_CHIP,
  PRIORITY_LABEL,
  PRIORITY_TONE,
} from "@/components/app/group/board/board.styles";
import type { TaskPriority } from "@/lib/tasks/tasks/tasks.types";

type PriorityMarkProps = {
  priority: TaskPriority;
};

const SHORT: Record<TaskPriority, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

/** Renders one task's priority. */
export function PriorityMark({ priority }: Readonly<PriorityMarkProps>) {
  return (
    <span className={`${PRIORITY_CHIP} ${PRIORITY_TONE[priority]}`}>
      <span className="sr-only">{PRIORITY_LABEL[priority]}</span>
      <span aria-hidden>{SHORT[priority]}</span>
    </span>
  );
}
