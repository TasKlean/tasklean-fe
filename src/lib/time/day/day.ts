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

/**
 * Reads the offset one zone was at, at one instant.
 *
 * @returns Minutes east of UTC, and 0 for a zone Intl names without an offset,
 * which is UTC itself.
 */
function offsetMinutes(at: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;

  const parts = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name ?? "");
  if (!parts) return 0;

  return (parts[1] === "-" ? -1 : 1) * (Number(parts[2]) * 60 + Number(parts[3]));
}

/**
 * Finds the instant a day begins in one zone, which is `dayKey` backwards.
 *
 * @param key A day as `YYYY-MM-DD`, which carries no zone of its own.
 * @returns Midnight that morning where the reader is. Invalid for a key that is
 * not a real date, which the caller checks.
 */
export function dayStart(key: string, timeZone: string): Date {
  const asUtc = new Date(`${key}T00:00:00Z`);
  // Twice, because the offset that applies is the one at the instant we are
  // looking for, not the one at that clock time in UTC.
  const near = new Date(asUtc.getTime() - offsetMinutes(asUtc, timeZone) * 60_000);

  return new Date(asUtc.getTime() - offsetMinutes(near, timeZone) * 60_000);
}

/**
 * Counts days off a day key, without a zone: a calendar date has none.
 *
 * @returns The key that many days later, or earlier for a negative count.
 */
export function shiftDays(key: string, days: number): string {
  return dayKey(new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY_MS), "UTC");
}

/**
 * Says whether a string names a real calendar day.
 *
 * @returns True for `YYYY-MM-DD` that exists. Checked by round-tripping the
 * key, because the 31st of February parses as the 3rd of March rather than
 * failing.
 */
export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const at = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(at.getTime()) && dayKey(at, "UTC") === value;
}
