/**
 * One chore, read: what it is at a glance, then the words, the picture, what
 * it is set to, its tags and who wrote it down.
 *
 * Body only. The panel's own header and footer belong to the shell around it,
 * which is where the presses live.
 */

import { CalendarClock, Camera, ImageIcon, Repeat2, Timer, UserRound } from "lucide-react";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { DueChip } from "@/components/app/group/board/due-chip/due-chip";
import { PriorityMark } from "@/components/app/group/board/priority-mark/priority-mark";
import { DescriptionBlock } from "@/components/app/group/board/task-panel/task-view/description-block";
import { FactCard } from "@/components/app/group/board/task-panel/task-view/fact-card";
import { FactRow } from "@/components/app/group/board/task-panel/task-view/fact-row";
import { StatusPill } from "@/components/app/group/board/status-pill/status-pill";
import {
  bylineLabel,
  minutesLabel,
  repeatsLabel,
} from "@/components/app/group/board/task-panel/task-view/task-view.helpers";
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import type { Category } from "@/lib/labels/categories/categories.types";
import { dueLabel } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

type TaskViewProps = {
  task: Task;
  category: Category | undefined;
  now: Date;
  timeZone: string;
};

const BODY =
  "px-space-lg py-space-md gap-space-md scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto";

const TITLE = "text-headline-md text-foreground";

const SECTION = "gap-space-xs text-label-md text-muted-foreground flex items-center";

// `shrink-0`: an empty box in a scrolling flex column has no content to hold
// its height, so without it the picture is squashed instead of the panel
// scrolling. Measured at 63px of the 176 it asks for.
const PHOTO = "bg-muted h-48 w-full shrink-0 rounded-xl bg-cover bg-center";

const ICON = "size-4 shrink-0";

/** Renders the chore the URL names. */
export function TaskView({ task, category, now, timeZone }: Readonly<TaskViewProps>) {
  const due = dueLabel(task, now, timeZone);
  const tags = task.tags ?? [];
  const photo = uploadedImageSrc(task.photoUid);
  const byline = bylineLabel(task, now, timeZone);

  return (
    <div className={BODY}>
      <div className="gap-space-xs flex flex-wrap items-center">
        <StatusPill status={task.status} />

        {task.priority ? <PriorityMark priority={task.priority} /> : null}

        {category?.name ? (
          <LabelChip
            name={category.name}
            color={category.color}
            icon={<CategoryIcon name={category.icon} />}
          />
        ) : null}
      </div>

      <h2 className={TITLE}>{task.name}</h2>

      {task.description ? <DescriptionBlock text={task.description} /> : null}

      {photo ? (
        <section className="gap-space-xs flex flex-col">
          <h3 className={SECTION}>
            <ImageIcon className={ICON} aria-hidden />
            Reference image
          </h3>

          {/* A background rather than an `img`: the object may legitimately be
              gone, and a background that 404s paints nothing where an `img`
              would draw the browser's broken glyph. */}
          <div
            role="img"
            aria-label="What this chore should look like"
            style={{ backgroundImage: `url(${photo})` }}
            className={PHOTO}
          />
        </section>
      ) : null}

      <FactCard>
        <FactRow icon={<UserRound className={ICON} aria-hidden />} label="Assigned to">
          <AssigneeChip member={task.assignedTo} />
        </FactRow>

        <FactRow icon={<CalendarClock className={ICON} aria-hidden />} label="Due date">
          {due ? <DueChip due={due} /> : "No date"}
        </FactRow>

        <FactRow icon={<Repeat2 className={ICON} aria-hidden />} label="Repeat">
          {repeatsLabel(task.recurrenceType)}
        </FactRow>

        <FactRow icon={<Timer className={ICON} aria-hidden />} label="Estimated time">
          {minutesLabel(task.estimatedTimeMinutes)}
        </FactRow>

        <FactRow icon={<Camera className={ICON} aria-hidden />} label="Photo proof">
          {task.requiresPhotoProof ? "Yes, required" : "Not needed"}
        </FactRow>
      </FactCard>

      <section className="gap-space-xs flex flex-col">
        <h3 className={SECTION}>Tags</h3>

        <div className="gap-space-xs flex flex-wrap items-center">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <LabelChip key={tag.id ?? tag.name} name={tag.name ?? ""} color={tag.color} />
            ))
          ) : (
            <span className="text-body-md text-muted-foreground">None</span>
          )}
        </div>
      </section>

      {byline ? <p className="text-label-sm text-muted-foreground text-right">{byline}</p> : null}
    </div>
  );
}
