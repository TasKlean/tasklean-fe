/**
 * Days and times as the reader's zone has them. Every function takes the zone
 * explicitly: this renders on the server, where the runtime's zone is the
 * container's, and again in the browser, where a second opinion would make the
 * two disagree after hydration.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Formats an instant in one zone. */
function formatIn(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone }).format(date);
}

/**
 * Identifies the day an instant falls on, in one zone.
 *
 * @returns `YYYY-MM-DD`, which sorts and compares as a string. Two instants
 * share a key only if the reader would call them the same day.
 */
export function dayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

/**
 * Names the day an instant falls on.
 *
 * @param now What counts as today, passed in so a whole feed agrees and a test
 * can fix the clock.
 * @returns "Today", "Yesterday", or the date spelled out.
 */
export function dayLabel(date: Date, now: Date, timeZone: string): string {
  const key = dayKey(date, timeZone);
  if (key === dayKey(now, timeZone)) return "Today";

  // A local day is 23 or 25 hours twice a year, but any instant on the previous
  // one still keys to it, because the clocks never move by more than an hour.
  if (key === dayKey(new Date(now.getTime() - DAY_MS), timeZone)) return "Yesterday";

  return formatIn(date, timeZone, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Says what time of day an instant is.
 *
 * @returns 24-hour clock time. `hourCycle` rather than `hour12: false`, which
 * draws midnight as 24:00.
 */
export function timeOfDay(date: Date, timeZone: string): string {
  return formatIn(date, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/**
 * Dates an instant without its year, for a column too narrow to spell it.
 *
 * @returns The day and month.
 */
export function shortDate(date: Date, timeZone: string): string {
  return formatIn(date, timeZone, { day: "numeric", month: "short" });
}

/**
 * Spells an instant out in full, for the title on a time that shows less.
 *
 * @returns The date and the clock time, with no zone named: every time on the
 * screen beside it is drawn in this same zone, which is the reader's own.
 */
export function fullTime(date: Date, timeZone: string): string {
  return formatIn(date, timeZone, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
