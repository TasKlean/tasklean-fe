/**
 * The single crossing point between API timestamps and `Date`. They are UTC with
 * no zone marker, so `new Date()` reads them as local; writing back must send no
 * marker either, since ISO_LOCAL_DATE_TIME rejects one.
 */

/** A trailing "Z", or a "+01:00" / "+0100" offset. */
const ZONE_MARKER = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export class InvalidApiDateError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`Could not parse "${value}" as an API timestamp.`);
    this.name = "InvalidApiDateError";
    this.value = value;
  }
}

/**
 * Parses an API timestamp, treating an unmarked string as UTC.
 *
 * @returns The instant the API meant, not the one a naive parse would give.
 * @throws InvalidApiDateError when the value is unparseable.
 */
export function parseApiDate(value: string): Date {
  const trimmed = value.trim();
  // An existing marker is respected rather than having a second one appended.
  const normalised = ZONE_MARKER.test(trimmed) ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalised);

  if (Number.isNaN(parsed.getTime())) throw new InvalidApiDateError(value);
  return parsed;
}

/**
 * As {@link parseApiDate}, but for the genuinely nullable fields (`dateLeft`,
 * `readAt`, `dateCompleted`), which saves a guard at every call site.
 *
 * @returns `null` for a missing, null or blank value.
 * @throws InvalidApiDateError when a present value is unparseable.
 */
export function parseApiDateOrNull(value: string | null | undefined): Date | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  return parseApiDate(value);
}

/**
 * Formats a `Date` the way the backend parses it: UTC wall time, no zone
 * marker, seconds precision.
 *
 * @returns e.g. `"2026-09-28T10:00:00"`. Sub-second precision is dropped —
 * accepted by ISO_LOCAL_DATE_TIME, but nothing we send needs it.
 * @throws InvalidApiDateError when given an invalid `Date`.
 */
export function toApiDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new InvalidApiDateError(String(date));
  return date.toISOString().slice(0, 19);
}
