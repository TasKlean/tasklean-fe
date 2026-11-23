/**
 * How long ago something happened, in words. Measured against an instant the
 * caller passes in, like every other time helper here, so the server's render
 * and the browser's hydration cannot disagree.
 */

import { shortDate } from "@/lib/time/day/day";

const MINUTE = 60_000;

const HOUR = 60 * MINUTE;

const DAY = 24 * HOUR;

// Past a month the gap stops being something a reader counts, so the date says
// more than the arithmetic does.
const DATED_AFTER = 30;

/** Words a count with the right singular. */
function counted(amount: number, unit: string): string {
  return `${amount} ${amount === 1 ? unit : `${unit}s`} ago`;
}

/**
 * Words how long ago an instant was.
 *
 * @param at The instant, already parsed from the API.
 * @param now The one instant the whole screen is measured against.
 * @returns A phrase for anything inside a month, and the date itself after
 * that. A time in the future reads as just now, a clock being able to disagree
 * with the backend's by a little.
 */
export function sinceLabel(at: Date, now: Date, timeZone: string): string {
  const gap = now.getTime() - at.getTime();

  if (gap < MINUTE) return "just now";
  if (gap < HOUR) return counted(Math.floor(gap / MINUTE), "minute");
  if (gap < DAY) return counted(Math.floor(gap / HOUR), "hour");

  const days = Math.floor(gap / DAY);

  if (days === 1) return "yesterday";
  if (days <= DATED_AFTER) return counted(days, "day");

  return shortDate(at, timeZone);
}
