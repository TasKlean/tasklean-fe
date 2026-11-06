/**
 * How long ago an API timestamp was, in words. Rendered on the server, so the
 * zone is pinned to UTC rather than taken from the runtime, which there is the
 * container's and not the reader's.
 */

import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Past a month "5 weeks ago" says less than a date does, and a trail is read
// for when exactly something happened.
const ABSOLUTE_AFTER = 30 * DAY;

/** Counts a unit in words, pluralised. */
function ago(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

/**
 * Says how long ago something happened.
 *
 * @param value An API timestamp, which is UTC with no zone marker.
 * @param now What to measure against, so a test can fix the clock.
 * @returns The phrase, a date once it is older than a month, or null when the
 * row carried no timestamp. A malformed one throws, as everywhere else that
 * crosses `api-date`: that is a contract break rather than a missing field.
 */
export function relativeTime(
  value: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const at = parseApiDateOrNull(value);
  if (!at) return null;

  const elapsed = now.getTime() - at.getTime();

  // Also covers a timestamp a few seconds ahead of us, which clock skew between
  // the backend and this process makes ordinary and "in 3 seconds" reads as a bug.
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return ago(Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return ago(Math.floor(elapsed / HOUR), "hour");
  if (elapsed < ABSOLUTE_AFTER) return ago(Math.floor(elapsed / DAY), "day");

  return at.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Spells a timestamp out, for the tooltip beside a relative one.
 *
 * @returns The date and time, named as UTC because that is the zone it is drawn
 * in, or null when the row carried no timestamp.
 */
export function exactTime(value: string | null | undefined): string | null {
  const at = parseApiDateOrNull(value);
  if (!at) return null;

  const spelled = at.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return `${spelled} UTC`;
}

/**
 * Turns a timestamp into the value a `<time>` element carries.
 *
 * @returns A full ISO string with its zone marker, which the API's own omits,
 * or null when the row carried no timestamp.
 */
export function isoTime(value: string | null | undefined): string | null {
  return parseApiDateOrNull(value)?.toISOString() ?? null;
}
