/**
 * One entry: when it happened on the left, who did it in the middle, what they
 * did on the right. The row draws the thread to the next one and drops it on
 * the last of its list, which is what cuts one day's section from the next.
 */

import { ChangeCard } from "@/components/common/activity/change-card";
import { TokenLine } from "@/components/common/activity/token-line";
import { Avatar } from "@/components/common/avatar/avatar";
import type { AuditEntry, AuditNames } from "@/lib/audit/audit.types";
import { auditLine } from "@/lib/audit/labels/labels";
import { fullTime, shortDate, timeOfDay } from "@/lib/time/day/day";

type ActivityRowProps = {
  entry: AuditEntry;
  // Parsed by the grouping, which had to read it to place the row.
  at: Date | null;
  // The reader's own user uid, so their own rows read "You".
  viewerUid: string | null;
  // Names for the entities on this page, keyed by ref.
  names: AuditNames;
  // The reader's zone, from the server, so the browser hydrates to the same
  // clock the server drew.
  timeZone: string;
  // Set where no heading above the row says which day it belongs to, so the
  // date goes over the time instead.
  dated: boolean;
};

/** Renders one audit entry as a step on the trail. */
export function ActivityRow({
  entry,
  at,
  viewerUid,
  names,
  timeZone,
  dated,
}: Readonly<ActivityRowProps>) {
  const line = auditLine(entry, viewerUid, names, timeZone);

  return (
    <li className="group gap-space-sm flex">
      {/* Aligned left so a time starts under its day's heading, and only as
          wide as a phone can spare: the slack falls between it and the avatar. */}
      <div className="pt-space-sm w-12 shrink-0 text-left sm:w-16">
        {at ? (
          <time
            dateTime={at.toISOString()}
            title={fullTime(at, timeZone)}
            className="text-label-sm text-muted-foreground block"
          >
            {dated ? <span className="block">{shortDate(at, timeZone)}</span> : null}
            {timeOfDay(at, timeZone)}
          </time>
        ) : null}
      </div>

      <div className="gap-space-xs flex flex-col items-center">
        <Avatar
          photoUrl={entry.actor?.photoUrl}
          name={entry.actor?.name}
          lastName={entry.actor?.lastName}
          size="xs"
        />

        {/* The thread between one step and the next, which the last step has
            nothing to join it to. */}
        <span aria-hidden className="bg-border/70 w-px flex-1 group-last:hidden" />
      </div>

      {/* `pt-1` rather than a token: it is half the difference between the
          avatar and a line of body text, which centres the two. */}
      <div className="gap-space-xs pb-space-lg flex min-w-0 flex-1 flex-col pt-1 group-last:pb-0">
        <p className="text-body-md text-muted-foreground break-words">
          <TokenLine tokens={line.sentence} />
        </p>

        <ChangeCard lines={line.details} />
      </div>
    </li>
  );
}
