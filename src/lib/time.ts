// The single crossing point between API timestamps and JavaScript Dates.
//
// The API's `date-time` fields come from Postgres `TIMESTAMP WITHOUT TIME ZONE`
// columns that the backend guarantees are UTC, but the strings carry no zone
// marker: "2026-09-28T10:00:00". `new Date()` reads an unmarked string as
// *local* time, so a naive parse is silently wrong by the viewer's offset.
// Every conversion goes through here; never `new Date(apiString)` elsewhere.
//
// Writing back is the mirror problem. The backend's DTOs are `LocalDateTime`
// with no Jackson configuration, so Spring parses with ISO_LOCAL_DATE_TIME —
// which accepts no zone marker at all. `toApiDate` therefore emits UTC *without*
// a trailing "Z". (`TaskRequest.nextDueDate` is currently the only writable
// date-time field in the whole API.)

// Matches a trailing "Z" or a "+01:00" / "+0100" offset.
const ZONE_MARKER = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export class InvalidApiDateError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`Could not parse "${value}" as an API timestamp.`);
    this.name = "InvalidApiDateError";
    this.value = value;
  }
}

// Parses an API timestamp into a Date, treating an unmarked string as UTC.
// A string that already carries a zone marker is respected as-is rather than
// having a second one appended.
export function parseApiDate(value: string): Date {
  const trimmed = value.trim();
  const normalised = ZONE_MARKER.test(trimmed) ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalised);

  if (Number.isNaN(parsed.getTime())) throw new InvalidApiDateError(value);
  return parsed;
}

// Many timestamp fields are genuinely nullable (`dateLeft`, `readAt`,
// `dateCompleted`), so this saves a guard at every call site.
export function parseApiDateOrNull(value: string | null | undefined): Date | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  return parseApiDate(value);
}

// Formats a Date as the backend expects: UTC wall time, no zone marker, seconds
// precision. Sub-second precision is dropped deliberately — ISO_LOCAL_DATE_TIME
// accepts it, but nothing we write needs it.
export function toApiDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new InvalidApiDateError(String(date));
  return date.toISOString().slice(0, 19);
}
