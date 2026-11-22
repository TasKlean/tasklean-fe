/**
 * The chore's settings, as a description list: how often it comes back, how
 * long it takes, whether finishing it needs a photo, and who wrote it down.
 *
 * A row is drawn only when the chore carries that field, so a plain one-off
 * chore shows a short list rather than a column of blanks.
 */

import { Fact } from "@/components/app/group/board/task-panel/fact";
import { fullName } from "@/lib/users/name/name";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { shortDate } from "@/lib/time/day/day";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

type TaskFactsProps = {
  task: Task;
  timeZone: string;
};

// `CUSTOM` is in the backend's enum and refused by it, so it has no wording
// here either: a chore cannot be saved with one.
const REPEATS: Record<string, string> = {
  DAILY: "Every day",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
};

const STATUS: Record<string, string> = {
  COMPLETED: "Done",
  ARCHIVED: "Retired",
};

/** Words a stretch of minutes the way somebody would say it. */
function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursSaid = `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return rest === 0 ? hoursSaid : `${hoursSaid} ${rest} min`;
}

/** Renders whatever the chore carries beyond its name and its labels. */
export function TaskFacts({ task, timeZone }: Readonly<TaskFactsProps>) {
  const author = fullName(task.createdBy?.name, task.createdBy?.lastName);
  const repeats = task.recurrenceType ? REPEATS[task.recurrenceType] : undefined;
  const status = task.status ? STATUS[task.status] : undefined;
  const completed = parseApiDateOrNull(task.dateCompleted);

  return (
    <dl className="gap-space-xs border-border/60 pt-space-md flex flex-col border-t">
      {status ? <Fact label="Status">{status}</Fact> : null}
      {repeats ? <Fact label="Repeats">{repeats}</Fact> : null}
      {task.estimatedTimeMinutes ? (
        <Fact label="Takes about">{minutesLabel(task.estimatedTimeMinutes)}</Fact>
      ) : null}
      {task.requiresPhotoProof ? <Fact label="Finishing it">Needs a photo</Fact> : null}
      {completed ? <Fact label="Finished">{shortDate(completed, timeZone)}</Fact> : null}
      {author ? <Fact label="Added by">{author}</Fact> : null}
    </dl>
  );
}
