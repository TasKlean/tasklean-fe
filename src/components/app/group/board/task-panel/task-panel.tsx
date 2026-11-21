/**
 * One chore, opened. Driven by `?task=` rather than by state, so it is a link
 * somebody can send, it survives a reload and the close is an ordinary
 * navigation: nothing here needs JavaScript.
 *
 * Read only. The presses that change a chore arrive with the form.
 */

import { X } from "lucide-react";
import Link from "next/link";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { DueChip } from "@/components/app/group/board/due-chip/due-chip";
import { PriorityMark } from "@/components/app/group/board/priority-mark/priority-mark";
import { TaskFacts } from "@/components/app/group/board/task-panel/task-facts";
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import type { Category } from "@/lib/labels/categories/categories.types";
import { dueLabel } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

type TaskPanelProps = {
  task: Task;
  category: Category | undefined;
  // Where the close press goes, which is the board without this chore on it.
  closeHref: string;
  now: Date;
  timeZone: string;
};

const PANEL =
  "bg-card border-border/60 p-space-lg gap-space-md flex flex-col rounded-xl border lg:sticky lg:top-space-md";

const CLOSE =
  "text-muted-foreground hover:bg-muted hover:text-foreground -mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors";

/** Renders the chore the URL names. */
export function TaskPanel({ task, category, closeHref, now, timeZone }: Readonly<TaskPanelProps>) {
  const due = dueLabel(task, now, timeZone);
  const tags = task.tags ?? [];
  const photo = uploadedImageSrc(task.photoUid);

  return (
    <aside aria-label={task.name ?? "Chore"} className={PANEL}>
      <div className="gap-space-sm flex items-start justify-between">
        <h3 className="text-title-lg text-foreground min-w-0 break-words">{task.name}</h3>

        <Link href={closeHref} aria-label="Close this chore" className={CLOSE}>
          <X className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="gap-space-xs flex flex-wrap items-center">
        {task.priority ? <PriorityMark priority={task.priority} /> : null}
        {due ? <DueChip due={due} /> : null}
        <AssigneeChip member={task.assignedTo} />
      </div>

      {category?.name || tags.length > 0 ? (
        <div className="gap-space-xs flex flex-wrap items-center">
          {category?.name ? (
            <LabelChip
              name={category.name}
              color={category.color}
              icon={<CategoryIcon name={category.icon} />}
            />
          ) : null}

          {tags.map((tag) => (
            <LabelChip key={tag.id ?? tag.name} name={tag.name ?? ""} color={tag.color} />
          ))}
        </div>
      ) : null}

      {task.description ? (
        <p className="text-body-md text-foreground whitespace-pre-line">{task.description}</p>
      ) : null}

      {photo ? (
        // A background rather than an `img`: the object may legitimately be
        // gone, and a background that 404s paints nothing where an `img` would
        // draw the browser's broken glyph.
        <div
          role="img"
          aria-label="What this chore should look like"
          style={{ backgroundImage: `url(${photo})` }}
          className="bg-muted h-40 w-full rounded-lg bg-cover bg-center"
        />
      ) : null}

      <TaskFacts task={task} timeZone={timeZone} />
    </aside>
  );
}
