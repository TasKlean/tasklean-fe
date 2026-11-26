/**
 * One recorded round, read: what became of it, the note somebody left and the
 * photo they took, then a card of the facts.
 *
 * Body only, like the task's own view: the shell around it carries the way
 * back to the task.
 */

import { CalendarClock, ImageIcon, Timer, UserRound } from "lucide-react";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { OutcomePill } from "@/components/app/group/board/outcome-pill/outcome-pill";
import { DescriptionBlock } from "@/components/app/group/board/task-panel/task-view/description-block";
import { FactCard } from "@/components/app/group/board/task-panel/task-view/fact-card";
import { FactRow } from "@/components/app/group/board/task-panel/task-view/fact-row";
import { minutesLabel } from "@/components/app/group/board/task-panel/task-view/task-view.helpers";
import type { TaskCompletion } from "@/lib/tasks/completions/completions.types";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { dayLabel, shortDate, timeOfDay } from "@/lib/time/day/day";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

type RoundViewProps = {
  round: TaskCompletion;
  // The one instant the panel is measured against, passed down like the
  // board's own.
  now: Date;
  timeZone: string;
};

const BODY =
  "px-space-lg py-space-md gap-space-md scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto";

const TITLE = "text-headline-md text-foreground";

const SECTION = "gap-space-xs text-label-md text-muted-foreground flex items-center";

// `shrink-0`: an empty box in a scrolling flex column has no height of its own
// to hold, so without it the picture is squashed instead of the panel
// scrolling.
const PHOTO = "bg-muted h-48 w-full shrink-0 rounded-xl bg-cover bg-center";

const ICON = "size-4 shrink-0";

const NOT_SET = "Not recorded";

/** Renders one round of a task. */
export function RoundView({ round, now, timeZone }: Readonly<RoundViewProps>) {
  const recorded = parseApiDateOrNull(round.dateCompleted ?? round.dateCreated);
  const due = parseApiDateOrNull(round.dueDate);
  const photo = uploadedImageSrc(round.completionPhotoUid);

  return (
    <div className={BODY}>
      <OutcomePill outcome={round.outcome} />

      <h2 className={TITLE}>
        {recorded
          ? `${dayLabel(recorded, now, timeZone)}, ${timeOfDay(recorded, timeZone)}`
          : NOT_SET}
      </h2>

      {round.completionNote ? <DescriptionBlock text={round.completionNote} /> : null}

      {photo ? (
        <section className="gap-space-xs flex flex-col">
          <h3 className={SECTION}>
            <ImageIcon className={ICON} aria-hidden />
            Photo proof
          </h3>

          {/* A background rather than an `img`: the object may legitimately be
              gone, and a background that 404s paints nothing. */}
          <div
            role="img"
            aria-label="The work this round recorded"
            style={{ backgroundImage: `url(${photo})` }}
            className={PHOTO}
          />
        </section>
      ) : null}

      <FactCard>
        <FactRow icon={<UserRound className={ICON} aria-hidden />} label="Recorded by">
          <AssigneeChip member={round.attributedTo} />
        </FactRow>

        <FactRow icon={<CalendarClock className={ICON} aria-hidden />} label="The round">
          {due ? shortDate(due, timeZone) : "No due date"}
        </FactRow>

        <FactRow icon={<Timer className={ICON} aria-hidden />} label="Time taken">
          {minutesLabel(round.minutes)}
        </FactRow>
      </FactCard>
    </div>
  );
}
