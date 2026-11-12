/**
 * The rows on screen, as one line down the page. Cut into days, or run together
 * with each row dated instead, which the feed above decides.
 */

import { ActivityRow } from "@/components/app/group/overview/activity/activity-row";
import { DaySectionsToggle } from "@/components/app/group/overview/activity/day-sections-toggle";
import type { AuditEntry, AuditNames } from "@/lib/audit/audit.types";
import { auditDays } from "@/lib/audit/days/days";
import type { AuditDayRow } from "@/lib/audit/days/days.types";

type ActivityTimelineProps = {
  entries: AuditEntry[];
  viewerUid: string | null;
  // One instant for the whole feed, so an appended page agrees with the first
  // about which day is today.
  now: Date;
  names: AuditNames;
  timeZone: string;
  // Whether a heading above each day says which one it is.
  grouped: boolean;
  onFlip: () => void;
};

// The rule the first day's heading hangs its press off, which is drawn on its
// own when the days are run together so the press does not move when pressed.
const RULE = "bg-border/70 h-px flex-1";

/** Keys a row on the uid the backend minted, or its place in a feed that only grows at its end. */
function rowKey(row: AuditDayRow, index: number): string {
  return row.entry.uid ?? `row-${index}`;
}

/** Renders the trail, cut into days or run together. */
export function ActivityTimeline({
  entries,
  viewerUid,
  now,
  names,
  timeZone,
  grouped,
  onFlip,
}: Readonly<ActivityTimelineProps>) {
  const days = auditDays(entries, now, timeZone);

  return (
    <div className="gap-space-md flex flex-col">
      {grouped ? (
        days.map((day, dayIndex) => (
          <section key={day.key} className="gap-space-sm flex flex-col">
            <div className="gap-space-sm flex items-center">
              <h3 className="text-label-lg text-muted-foreground shrink-0">{day.label}</h3>
              <span aria-hidden className={RULE} />
              {/* The first day only: one press, where the headings start. */}
              {dayIndex === 0 ? <DaySectionsToggle on onFlip={onFlip} /> : null}
            </div>

            <ol className="flex flex-col">
              {day.rows.map((row, index) => (
                <ActivityRow
                  key={rowKey(row, index)}
                  entry={row.entry}
                  at={row.at}
                  viewerUid={viewerUid}
                  names={names}
                  timeZone={timeZone}
                  dated={false}
                />
              ))}
            </ol>
          </section>
        ))
      ) : (
        <>
          <div className="gap-space-sm flex items-center">
            <span aria-hidden className={RULE} />
            <DaySectionsToggle on={false} onFlip={onFlip} />
          </div>

          <ol className="flex flex-col">
            {days
              .flatMap((day) => day.rows)
              .map((row, index) => (
                <ActivityRow
                  key={rowKey(row, index)}
                  entry={row.entry}
                  at={row.at}
                  viewerUid={viewerUid}
                  names={names}
                  timeZone={timeZone}
                  dated
                />
              ))}
          </ol>
        </>
      )}
    </div>
  );
}
