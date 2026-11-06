/**
 * One entry in a group's activity. The avatar says who, the sentence says what,
 * and the chip says which kind of thing it was about. The timestamp is drawn
 * relative with the exact UTC value behind it, since a trail is read for when.
 */

import { Avatar } from "@/components/common/avatar/avatar";
import type { AuditEntry } from "@/lib/audit/audit.types";
import { auditSentence, entityLabel } from "@/lib/audit/labels/labels";
import { exactTime, isoTime, relativeTime } from "@/lib/time/relative/relative";

type ActivityRowProps = {
  entry: AuditEntry;
  // The reader's own user uid, so their own rows read "You".
  viewerUid: string | null;
};

const CHIP =
  "text-label-sm bg-muted text-muted-foreground shrink-0 px-space-sm rounded-full py-0.5";

/** Renders one audit entry as a card. */
export function ActivityRow({ entry, viewerUid }: Readonly<ActivityRowProps>) {
  const kind = entityLabel(entry.entity?.type);
  const when = relativeTime(entry.dateCreated);

  return (
    <li className="bg-card border-border/60 p-space-md gap-space-md flex items-start rounded-xl border">
      <Avatar
        photoUrl={entry.actor?.photoUrl}
        name={entry.actor?.name}
        lastName={entry.actor?.lastName}
      />

      <div className="gap-space-md flex min-w-0 flex-1 items-start justify-between">
        <div className="gap-space-xs flex min-w-0 flex-col">
          <p className="text-body-md text-foreground break-words">
            {auditSentence(entry, viewerUid)}
          </p>

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

        {kind ? <span className={CHIP}>{kind}</span> : null}
      </div>
    </li>
  );
}
