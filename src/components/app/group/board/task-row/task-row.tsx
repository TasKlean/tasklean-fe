/**
 * One chore on the board. A link rather than a button: the open chore is a URL
 * (`?task=`), so it is shareable, works with no JavaScript and leaves the back
 * button meaning what a reader expects.
 */

import Link from "next/link";
import { META, ROW, ROW_TITLE } from "@/components/app/group/board/board.styles";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { DueChip } from "@/components/app/group/board/due-chip/due-chip";
import { PriorityMark } from "@/components/app/group/board/priority-mark/priority-mark";
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import { dueLabel } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import type { Category } from "@/lib/labels/categories/categories.types";

type TaskRowProps = {
  task: Task;
  // The chore's own category, already looked up: a row holds a numeric id and
  // the list is read once for the whole board rather than once per row.
  category: Category | undefined;
  href: string;
  now: Date;
  timeZone: string;
};

/** Renders one chore as a row on the board. */
export function TaskRow({ task, category, href, now, timeZone }: Readonly<TaskRowProps>) {
  const due = dueLabel(task, now, timeZone);
  const tags = task.tags ?? [];

  return (
    <li>
      <Link href={href} className={ROW}>
        <span className="min-w-0 flex-1">
          <span className={`${ROW_TITLE} block truncate`}>{task.name}</span>

          <span className={META}>
            {task.priority ? <PriorityMark priority={task.priority} /> : null}
            {due ? <DueChip due={due} /> : null}

            {category?.name ? (
              <LabelChip
                name={category.name}
                color={category.color}
                size="sm"
                icon={<CategoryIcon name={category.icon} />}
              />
            ) : null}

            {tags.map((tag) => (
              <LabelChip
                key={tag.id ?? tag.name}
                name={tag.name ?? ""}
                color={tag.color}
                size="sm"
              />
            ))}
          </span>
        </span>

        <AssigneeChip member={task.assignedTo} />
      </Link>
    </li>
  );
}
