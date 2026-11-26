/**
 * One recorded round in the task's history: the round it was recorded
 * against, what became of it, when it was recorded, what it took and who it is
 * attributed to.
 *
 * Built like a row on the board, down to the date column's own width, so the
 * two read as one family. A link rather than a press, so a round is something
 * a reader can send and a reload still shows, and its name is spelled out, the
 * row being several elements the accessible name would run together.
 */

import { ChevronRight, ImageIcon, StickyNote } from "lucide-react";
import Link from "next/link";
import { AssigneeChip } from "@/components/app/group/board/assignee-chip/assignee-chip";
import { ROW_DUE } from "@/components/app/group/board/board.styles";
import { OutcomePill } from "@/components/app/group/board/outcome-pill/outcome-pill";
import { minutesLabel } from "@/components/app/group/board/task-panel/task-view/task-view.helpers";
import { outcomeLabel } from "@/lib/tasks/completions/completions.helpers";
import type { TaskCompletion } from "@/lib/tasks/completions/completions.types";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { dayLabel, numericDate, shortDate, timeOfDay } from "@/lib/time/day/day";
import { fullName } from "@/lib/users/name/name";

type HistoryRowProps = {
  round: TaskCompletion;
  href: string;
  // The one instant the whole panel is measured against, so an appended page
  // agrees with the first and the browser hydrates to what the server drew.
  now: Date;
  timeZone: string;
};

// Four columns and two lines, the board's own shape: the date, what the round
// was, the member and the chevron, with the outer three centred down both
// lines.
const ROW =
  "border-border/60 hover:bg-muted focus-visible:ring-ring gap-x-space-sm p-space-sm grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-y-1 rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none";

// Drawn like the task's own name, as on the board, but with no tone: a round
// that has been recorded can never be late.
const DIGITS = "text-body-lg-strong text-foreground tabular-nums";

const SAID = "text-label-sm text-muted-foreground col-start-2 row-start-2 truncate";

// A circle rather than a bare glyph, so a note and a photo read as marks on
// the round rather than as icons somebody forgot to label.
const MARK = "bg-muted text-muted-foreground grid size-6 shrink-0 place-items-center rounded-full";

const MARK_ICON = "size-3.5 shrink-0";

const ICON = "size-4 shrink-0 text-muted-foreground";

const SIDE = "row-span-2 row-start-1 self-center";

/** Renders one round as a row that opens it. */
export function HistoryRow({ round, href, now, timeZone }: Readonly<HistoryRowProps>) {
  const recorded = parseApiDateOrNull(round.dateCompleted ?? round.dateCreated);
  const due = parseApiDateOrNull(round.dueDate);
  const who = fullName(round.attributedTo?.name, round.attributedTo?.lastName);
  const said = recorded
    ? `${dayLabel(recorded, now, timeZone)}, ${timeOfDay(recorded, timeZone)}`
    : "Date not recorded";
  const took = round.minutes ? minutesLabel(round.minutes) : null;

  const name = [
    outcomeLabel(round.outcome),
    due ? `for ${shortDate(due, timeZone)}` : null,
    said,
    took,
    who,
    round.completionNote ? "with a note" : null,
    round.completionPhotoUid ? "with a photo" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link href={href} aria-label={name} className={ROW}>
      {/* The slot is kept on a round with no date of its own, so every pill
          down the list starts at one edge. */}
      <span className={`${ROW_DUE} ${DIGITS}`}>{due ? numericDate(due, now, timeZone) : null}</span>

      <span className="gap-space-xs col-start-2 row-start-1 flex min-w-0 items-center">
        <OutcomePill outcome={round.outcome} />

        {round.completionNote ? (
          <span className={MARK}>
            <StickyNote className={MARK_ICON} aria-hidden />
          </span>
        ) : null}

        {round.completionPhotoUid ? (
          <span className={MARK}>
            <ImageIcon className={MARK_ICON} aria-hidden />
          </span>
        ) : null}
      </span>

      <span className={SAID}>{took ? `${said} · ${took}` : said}</span>

      <span className={`${SIDE} col-start-3`}>
        <AssigneeChip member={round.attributedTo} compact />
      </span>

      <ChevronRight className={`${ICON} ${SIDE} col-start-4`} aria-hidden />
    </Link>
  );
}
