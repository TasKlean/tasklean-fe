/**
 * Cutting a trail into the days a reader thinks in. The zone is passed in
 * rather than read, so the server's sections and the browser's agree, and one
 * instant decides what "today" means for the whole feed.
 */

import type { AuditEntry } from "@/lib/audit/audit.types";
import type { AuditDay } from "@/lib/audit/days/days.types";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { dayKey, dayLabel } from "@/lib/time/day/day";

// A row the backend sent no timestamp with cannot be placed in a day. It keeps
// its position in the feed instead, under whichever day runs above it.
const UNDATED = { key: "undated", label: "Undated" };

/**
 * Groups entries into the days they happened on.
 *
 * @param entries The feed, newest first, which is the order the sections and
 * their rows keep.
 * @param now What counts as today, so every page of the feed agrees.
 * @param timeZone The zone the days are counted in, which is the reader's own.
 * @returns One section per day, each with its rows and the date they share.
 */
export function auditDays(entries: AuditEntry[], now: Date, timeZone: string): AuditDay[] {
  const days: AuditDay[] = [];

  for (const entry of entries) {
    const at = parseApiDateOrNull(entry.dateCreated);
    const open = days.at(-1);
    const key = at ? dayKey(at, timeZone) : (open?.key ?? UNDATED.key);

    if (open?.key === key) {
      open.rows.push({ entry, at });
      continue;
    }

    days.push({
      key,
      label: at ? dayLabel(at, now, timeZone) : UNDATED.label,
      rows: [{ entry, at }],
    });
  }

  return days;
}
