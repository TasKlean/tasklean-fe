/**
 * One entry in a filtered trail, drawn as a point on a line. Every row in such
 * a feed is the same kind of thing, so the entity chip a card carries would say
 * the same word on all of them and is left out.
 */

import { ChangedFields } from "@/components/app/group/overview/activity/changed-fields";
import { Avatar } from "@/components/common/avatar/avatar";
import type { AuditEntry } from "@/lib/audit/audit.types";
import { auditSentence } from "@/lib/audit/labels/labels";
import { exactTime, isoTime, relativeTime } from "@/lib/time/relative/relative";

type TimelineRowProps = {
  entry: AuditEntry;
  // The reader's own user uid, so their own rows read "You".
  viewerUid: string | null;
  // Measured once for the whole feed, so appended rows agree with the first
  // page and the server's render is what the browser hydrates to.
  now: Date;
};

/** Renders one audit entry as a step in a sequence. */
export function TimelineRow({ entry, viewerUid, now }: Readonly<TimelineRowProps>) {
  const when = relativeTime(entry.dateCreated, now);

  return (
    <li className="group gap-space-md flex">
      <div className="gap-space-xs flex flex-col items-center">
        <Avatar
          photoUrl={entry.actor?.photoUrl}
          name={entry.actor?.name}
          lastName={entry.actor?.lastName}
        />

        {/* The thread between one step and the next, which the last step has
            nothing to join it to. */}
        <span aria-hidden className="bg-border/70 w-px flex-1 group-last:hidden" />
      </div>

      <div className="gap-space-xs pb-space-lg flex min-w-0 flex-1 flex-col group-last:pb-0">
        <p className="text-body-md text-foreground break-words">
          {auditSentence(entry, viewerUid)}
        </p>

        <ChangedFields changes={entry.changedFields} />

        {when ? (
          <time
            dateTime={isoTime(entry.dateCreated) ?? undefined}
            title={exactTime(entry.dateCreated) ?? undefined}
            className="text-label-sm text-muted-foreground"
          >
            {when}
          </time>
        ) : null}
      </div>
    </li>
  );
}
