/**
 * One chore as a card, with its reference photo as the face. A chore with no
 * photo wears its category's colour instead, so the grid reads as a grid
 * rather than as a row of grey boxes.
 */

import Link from "next/link";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { DueChip } from "@/components/app/group/board/due-chip/due-chip";
import { PriorityMark } from "@/components/app/group/board/priority-mark/priority-mark";
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { Tooltip } from "@/components/common/tooltip/tooltip";
import type { Category } from "@/lib/labels/categories/categories.types";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import { dueLabel } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

type TaskCardProps = {
  task: Task;
  category: Category | undefined;
  href: string;
  now: Date;
  timeZone: string;
};

// No `overflow-hidden`: a bubble is an absolute child and the card would clip
// it, so the photo rounds its own top corners instead.
const CARD =
  "bg-card border-border/60 hover:bg-muted/40 flex h-full w-full flex-col rounded-xl border text-left transition-colors";

// The colour is the label's own stored hex, which is data rather than a token.
const FACE =
  "relative grid h-28 w-full shrink-0 place-items-center rounded-t-xl bg-cover bg-center";

/** Renders one chore as a card. */
export function TaskCard({ task, category, href, now, timeZone }: Readonly<TaskCardProps>) {
  const due = dueLabel(task, now, timeZone);
  const photo = uploadedImageSrc(task.photoUid);
  const tint = category?.color ?? DEFAULT_SWATCH;

  return (
    <li>
      <Link href={href} className={CARD}>
        {/* The colour sits under the photo rather than beside it, so an upload
            that 404s falls back with no handler and no second request. */}
        <span
          aria-hidden
          style={{
            backgroundColor: `color-mix(in srgb, ${tint} 22%, transparent)`,
            backgroundImage: photo ? `url(${photo})` : undefined,
          }}
          className={FACE}
        >
          {photo ? null : <CategoryIcon name={category?.icon} className="size-7 opacity-60" />}
        </span>

        <span className="p-space-md gap-space-xs flex min-w-0 flex-1 flex-col">
          <span className="text-body-lg text-foreground line-clamp-2">{task.name}</span>

          <span className="gap-space-xs mt-auto flex flex-wrap items-center">
            {task.priority ? (
              <Tooltip text="Priority">
                <PriorityMark priority={task.priority} />
              </Tooltip>
            ) : null}

            {due ? (
              <Tooltip text={due.title}>
                <DueChip due={due} />
              </Tooltip>
            ) : null}
          </span>

          {/* A column stretches its children, so the pill needs a row of
              its own to hug its contents rather than span the card. */}
          <Tooltip text="Assigned to" width="shrink">
            <AssigneeChip member={task.assignedTo} />
          </Tooltip>
        </span>
      </Link>
    </li>
  );
}
