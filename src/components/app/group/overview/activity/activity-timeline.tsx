/**
 * The rows on screen, as one line down the page. Day sections are the default
 * and the switch takes them away, which is this component's own state and
 * nothing the backend or the URL knows about.
 */

import { useState } from "react";
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
};

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
}: Readonly<ActivityTimelineProps>) {
  const [grouped, setGrouped] = useState(true);
  const days = auditDays(entries, now, timeZone);

  return (
    <div className="gap-space-md flex flex-col">
      <DaySectionsToggle on={grouped} onFlip={() => setGrouped((was) => !was)} />

      {grouped ? (
        days.map((day) => (
          <section key={day.key} className="gap-space-sm flex flex-col">
            <h3 className="text-label-lg text-muted-foreground">{day.label}</h3>

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
      )}
    </div>
  );
}
