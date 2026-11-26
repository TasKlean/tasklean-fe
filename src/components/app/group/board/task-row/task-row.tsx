/**
 * One task on the board, in two lines: when it is wanted at the head of the
 * row, what it is on the upper line and how it behaves on the lower. A link
 * rather than a button, since the open task is a URL (`?task=`).
 *
 * The marks are written once and placed twice, because no one container can
 * be both the line under the name and the end of the row of pills, which is
 * where a phone has the room for them.
 */

import Link from "next/link";
import {
  ROW_DUE,
  ROW_MAIN,
  ROW_META,
  ROW_SIDE,
  ROW_TITLE,
} from "@/components/app/group/board/board.styles";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { DueDigits } from "@/components/app/group/board/due-digits/due-digits";
import { PriorityMark } from "@/components/app/group/board/priority-mark/priority-mark";
import { RowPress } from "@/components/app/group/board/task-row/row-press";
import { StatusPill } from "@/components/app/group/board/status-pill/status-pill";
import { TaskMarks } from "@/components/app/group/board/task-marks/task-marks";
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import { Tooltip } from "@/components/common/tooltip/tooltip";
import { dueDigits } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import type { Category } from "@/lib/labels/categories/categories.types";

type TaskRowProps = {
  task: Task;
  // The task's own category, already looked up: a row holds a numeric id and
  // the list is read once for the whole board rather than once per row.
  category: Category | undefined;
  href: string;
  // The same task with the editor already open, which the menu's Edit leads
  // to. Editing is the panel's own state, and a row cannot reach it.
  editHref: string;
  groupUid: string;
  // False where the task is not the reader's to change, which leaves the
  // menu with View alone. UX only: each press handles its own 403.
  canEdit: boolean;
  now: Date;
  timeZone: string;
};

/** Renders one task as a row on the board. */
export function TaskRow({
  task,
  category,
  href,
  editHref,
  groupUid,
  canEdit,
  now,
  timeZone,
}: Readonly<TaskRowProps>) {
  const due = dueDigits(task, now, timeZone);
  const marks = { recurrence: task.recurrenceType, photoProof: Boolean(task.requiresPhotoProof) };

  return (
    <RowPress
      actions={{
        groupUid,
        taskUid: task.uid ?? "",
        name: task.name ?? "this task",
        viewHref: href,
        editHref,
        canEdit,
      }}
    >
      <span className={ROW_DUE}>
        {due ? (
          <Tooltip text={due.title} place="above-start">
            <DueDigits due={due} />
          </Tooltip>
        ) : null}
      </span>

      <Link href={href} className={ROW_MAIN}>
        <Tooltip text="Status">
          <StatusPill status={task.status} compact />
        </Tooltip>

        <span className={`${ROW_TITLE} min-w-0 truncate`}>{task.name}</span>

        {/* Its own line on a phone, which is what `w-full` buys: the name
            keeps the line above to itself. */}
        <span className="gap-space-xs flex w-full min-w-0 flex-wrap items-center gap-y-1 sm:w-auto sm:flex-nowrap">
          {/* A chip is `max-w-full` and truncates inside, which needs a flex
              parent that may shrink: a long category would push the rest out. */}
          {task.priority ? (
            <Tooltip text="Priority">
              <PriorityMark priority={task.priority} />
            </Tooltip>
          ) : null}

          {category?.name ? (
            <Tooltip text="Category" width="shrink">
              <LabelChip
                name={category.name}
                color={category.color}
                size="sm"
                icon={<CategoryIcon name={category.icon} />}
              />
            </Tooltip>
          ) : null}

          <span className="gap-space-xs flex items-center sm:hidden">
            <TaskMarks {...marks} words={false} />
          </span>
        </span>
      </Link>

      <span className={ROW_SIDE}>
        <Tooltip text="Assigned to" place="above-end">
          <AssigneeChip member={task.assignedTo} compact />
        </Tooltip>
      </span>

      <span className={ROW_META}>
        <TaskMarks {...marks} />
      </span>
    </RowPress>
  );
}
