/**
 * One task, read: what it is at a glance, then the words, the picture, what
 * it is set to, its tags and who wrote it down.
 *
 * Body only. The panel's own header and footer belong to the shell around it,
 * which is where the presses live.
 */

import {
  CalendarClock,
  Camera,
  ImageIcon,
  Repeat2,
  Timer,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { ClaimChip } from "@/components/app/group/board/claim-chip/claim-chip";
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
import { ClippedName } from "@/components/common/clipped-name/clipped-name";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import { Tooltip } from "@/components/common/tooltip/tooltip";
import type { Category } from "@/lib/labels/categories/categories.types";
import { dueLabel } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

type TaskViewProps = {
  task: Task;
  category: Category | undefined;
  groupUid: string;
  // True where nobody holds the task and a round is open, which turns the
  // assignee's own chip into the press that takes it.
  canClaim: boolean;
  now: Date;
  timeZone: string;
  // The rounds this task has recorded, read by the page and rendered inside
  // this body because the body is what scrolls.
  history: ReactNode;
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

/** Renders the task the URL names. */
export function TaskView({
  task,
  category,
  groupUid,
  canClaim,
  now,
  timeZone,
  history,
}: Readonly<TaskViewProps>) {
  const due = dueLabel(task, now, timeZone);
  const tags = task.tags ?? [];
  const photo = uploadedImageSrc(task.photoUid);
  const byline = bylineLabel(task, now, timeZone);

  return (
    <div className={BODY}>
      {/* The bubbles hang below their row: this is the first row of a box
          that scrolls, which clips whatever sits above it. */}
      <div className="gap-space-xs flex flex-wrap items-center">
        <Tooltip text="Status" place="below">
          <StatusPill status={task.status} />
        </Tooltip>

        {task.priority ? (
          <Tooltip text="Priority" place="below">
            <PriorityMark priority={task.priority} />
          </Tooltip>
        ) : null}

        {category?.name ? (
          <Tooltip text="Category" place="below" width="shrink">
            <LabelChip
              name={category.name}
              color={category.color}
              icon={<CategoryIcon name={category.icon} />}
            />
          </Tooltip>
        ) : null}
      </div>

      <h2 className="min-w-0">
        <ClippedName name={task.name ?? ""} className={TITLE} />
      </h2>

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
            aria-label="What this task should look like"
            style={{ backgroundImage: `url(${photo})` }}
            className={PHOTO}
          />
        </section>
      ) : null}

      <FactCard>
        <FactRow icon={<UserRound className={ICON} aria-hidden />} label="Assigned to">
          {canClaim ? (
            <ClaimChip
              groupUid={groupUid}
              taskUid={task.uid ?? ""}
              name={task.name ?? "this task"}
            />
          ) : (
            <AssigneeChip member={task.assignedTo} />
          )}
        </FactRow>

        {/* Only where there are rounds to come, or where somebody owns it
            anyway: a one-off nobody owns has nothing to hand back. */}
        {task.recurrenceType || task.defaultAssignee ? (
          <FactRow icon={<UserRoundCheck className={ICON} aria-hidden />} label="Task owner">
            {task.defaultAssignee ? <AssigneeChip member={task.defaultAssignee} /> : "Anybody"}
          </FactRow>
        ) : null}

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
              <LabelChip
                key={tag.id ?? tag.name}
                name={tag.name ?? ""}
                color={tag.color}
                kind="tag"
              />
            ))
          ) : (
            <span className="text-body-md text-muted-foreground">None</span>
          )}
        </div>
      </section>

      {byline ? <p className="text-label-sm text-muted-foreground text-right">{byline}</p> : null}

      {history}
    </div>
  );
}
