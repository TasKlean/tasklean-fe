/**
 * One task as a card, with its reference photo as the face: the name reads off
 * the foot of the picture, what it is set to sits under it. A task with no
 * photo wears its category's colour instead, so the grid reads as a grid
 * rather than as a row of grey boxes.
 *
 * The name is the link and it is stretched over the whole card, which is what
 * lets the menu be a real button over the picture rather than a control
 * nested in an anchor.
 */

import { CalendarClock, Pencil, Timer } from "lucide-react";
import Link from "next/link";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { ClaimChip } from "@/components/app/group/board/claim-chip/claim-chip";
import {
  CARD_ACTION,
  CARD_ACTIONS,
  CARD_DIVIDER,
  CARD_FILL,
  DUE_WORDS,
} from "@/components/app/group/board/board.styles";
import { PriorityMark } from "@/components/app/group/board/priority-mark/priority-mark";
import { StatusPill } from "@/components/app/group/board/status-pill/status-pill";
import { CardMenu } from "@/components/app/group/board/card-menu/card-menu";
import { TaskMarks } from "@/components/app/group/board/task-marks/task-marks";
import { minutesLabel } from "@/components/app/group/board/task-panel/task-view/task-view.helpers";
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import { Tooltip } from "@/components/common/tooltip/tooltip";
import type { Category } from "@/lib/labels/categories/categories.types";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import { dueSpelled } from "@/lib/tasks/due/due";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

type TaskCardProps = {
  task: Task;
  category: Category | undefined;
  href: string;
  // The same task with the editor already open, which the menu's Edit leads
  // to. Editing is the panel's own state, and a card cannot reach it.
  editHref: string;
  groupUid: string;
  // False where the task is not the reader's to change, which leaves the
  // menu with View alone. UX only: each press handles its own 403.
  canEdit: boolean;
  // True where nobody holds the task and a round is open, which turns the
  // pool chip into the press that takes it.
  canClaim: boolean;
  // False where the task is archived already, or is not the reader's.
  canArchive: boolean;
  now: Date;
  timeZone: string;
};

// No `overflow-hidden`: a bubble is an absolute child and the card would clip
// it, so the photo rounds its own top corners instead.
const CARD =
  "bg-card border-border/60 hover:bg-muted/40 has-[a:focus-visible]:ring-ring group relative flex h-full w-full flex-col rounded-xl border text-left transition-colors has-[a:focus-visible]:ring-2";

// Taller from `sm`, where the picture is the face of the card rather than a
// strip above the words. The colour is the label's own stored hex, which is
// data rather than a token.
const FACE =
  "relative grid h-36 w-full shrink-0 place-items-center rounded-t-xl bg-cover bg-center sm:h-48";

// The name sits on the picture, so it is read off the card's own colour
// rising out of it: dark words over a pale wash in one scheme and pale words
// over a dark one in the other, with no second palette to keep in step.
// Three stops over a tall box, so the picture fades into the card instead of
// meeting a visible edge: solid under the words, half way up the middle of it
// and gone at the top. The height is the gradient's own length, which is why
// the padding above the name is the biggest on the card.
const SCRIM =
  "from-card from-20% via-card/50 via-60% px-space-md pt-space-3xl pb-space-md absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent";

// The two presses over the picture, which fade in under a mouse and stay
// drawn for a finger, there being no hover to reveal them with. An open menu
// holds them there, or the panel would be left hanging off nothing.
const ACTIONS =
  "top-space-xs right-space-xs pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100 pointer-fine:has-[[aria-expanded=true]]:opacity-100 absolute transition-opacity";

// A step up the scale from a row's own name: a card has one name on it and
// the picture under it, where a row has a column of them to measure against.
// `title-lg` is the step the scale grew for this: a card has one name on it
// and a picture under it, where a row has a column of them to measure against.
const TITLE = "text-title-lg text-foreground line-clamp-2 after:absolute after:inset-0";

// Tighter above and below than at the sides, where the gutter is the name's
// own: the lines inside it are what carry the height, not the padding.
const BODY = "px-space-md py-space-sm gap-space-md flex min-w-0 flex-1 flex-col";

const PILLS = "gap-x-space-xs gap-y-1 flex min-w-0 flex-wrap items-center";

const FACTS = "gap-x-space-sm gap-y-1 flex min-w-0 flex-wrap items-center";

// A fact as words with its icon, which is how the repeat and the photo proof
// already read: the date joins them rather than wearing a pill of its own.
const FACT = "text-label-sm gap-1 flex shrink-0 items-center whitespace-nowrap";

const ESTIMATE = `${FACT} text-muted-foreground`;

/** Renders one task as a card. */
export function TaskCard({
  task,
  category,
  href,
  editHref,
  groupUid,
  canEdit,
  canClaim,
  canArchive,
  now,
  timeZone,
}: Readonly<TaskCardProps>) {
  const due = dueSpelled(task, now, timeZone);
  const photo = uploadedImageSrc(task.photoUid);
  const tint = category?.color ?? DEFAULT_SWATCH;
  const minutes = task.estimatedTimeMinutes;
  const name = task.name ?? "this task";

  return (
    <li className={CARD}>
      {/* The colour sits under the photo rather than beside it, so an upload
          that 404s falls back with no handler and no second request. */}
      <span
        style={{
          backgroundColor: `color-mix(in srgb, ${tint} 22%, transparent)`,
          backgroundImage: photo ? `url(${photo})` : undefined,
        }}
        className={FACE}
      >
        {photo ? null : (
          <CategoryIcon name={category?.icon} className="size-7 opacity-60" aria-hidden />
        )}

        {/* The one pill on the picture, at the gutter the name below it
            keeps. The rest ride under it, where there is room for words. */}
        <span className="top-space-md left-space-md absolute">
          <Tooltip text="Status" place="below">
            <StatusPill status={task.status} />
          </Tooltip>
        </span>

        <span className={`${ACTIONS} ${CARD_ACTIONS}`}>
          {canEdit ? (
            <>
              <Link
                href={editHref}
                aria-label={`Edit ${name}`}
                className={`${CARD_ACTION} ${CARD_FILL.off}`}
              >
                <Pencil className="size-4 shrink-0" aria-hidden />
              </Link>

              <span className={CARD_DIVIDER} aria-hidden />
            </>
          ) : null}

          <CardMenu
            groupUid={groupUid}
            taskUid={task.uid ?? ""}
            name={name}
            viewHref={href}
            canEdit={canEdit}
            canClaim={canClaim}
            canArchive={canArchive}
          />
        </span>

        <span className={SCRIM}>
          <Link href={href} className={TITLE}>
            {task.name}
          </Link>
        </span>
      </span>

      <span className={BODY}>
        {/* The line that reads straight off the picture: the date in words,
            then how often it comes back and whether it is photographed. */}
        <span className={FACTS}>
          {due ? (
            <Tooltip text={due.tone === "later" ? "Due date" : due.title} place="above-start">
              <span className={`${FACT} ${DUE_WORDS[due.tone]}`}>
                <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                {/* The colour says it at a glance and this says it outright,
                    which is what a reader who cannot see the colour hears. */}
                <span className="sr-only">{due.tone === "overdue" ? "Overdue" : "Due"}</span>
                {due.text}
              </span>
            </Tooltip>
          ) : null}

          <TaskMarks recurrence={task.recurrenceType} photoProof={false} place="above-start" />

          {/* The far end of the same line, so the date and the repeat read as
              one phrase and what the task asks for stands apart from them. */}
          <span className="ml-auto flex">
            <TaskMarks
              recurrence={undefined}
              photoProof={Boolean(task.requiresPhotoProof)}
              place="above-end"
            />
          </span>
        </span>

        <span className={PILLS}>
          {task.priority ? (
            <Tooltip text="Priority" place="above-start">
              <PriorityMark priority={task.priority} />
            </Tooltip>
          ) : null}

          {category?.name ? (
            <Tooltip text="Category" place="above-start" width="shrink">
              <LabelChip
                name={category.name}
                color={category.color}
                size="sm"
                icon={<CategoryIcon name={category.icon} />}
              />
            </Tooltip>
          ) : null}
        </span>

        {/* A column stretches its children, so the chip needs a row of its
            own to hug its contents rather than span the card. The two sit on
            the floor of it, the estimate reading along the chip's own base
            rather than floating against the middle of the circle. */}
        <span className="gap-space-sm mt-auto flex items-end justify-between">
          {canClaim ? (
            <ClaimChip groupUid={groupUid} taskUid={task.uid ?? ""} name={name} />
          ) : (
            <Tooltip text="Assigned to" place="above-start" width="shrink">
              <AssigneeChip member={task.assignedTo} />
            </Tooltip>
          )}

          {minutes ? (
            <Tooltip text="Estimated time" place="above-end">
              <span className={ESTIMATE}>
                <Timer className="size-3.5 shrink-0" aria-hidden />
                {minutesLabel(minutes)}
              </span>
            </Tooltip>
          ) : null}
        </span>
      </span>
    </li>
  );
}
