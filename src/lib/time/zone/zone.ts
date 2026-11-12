/**
 * The reader's own time zone, cached in a cookie so the server can draw a local
 * time without the browser disagreeing with it after hydration. The browser is
 * the authority here, unlike the theme: no API field holds a zone and no request
 * header carries one, so the cookie is written in the browser and read here.
 *
 * No `server-only`: the component that writes it needs the name and the shape.
 */

export const ZONE_COOKIE_NAME = "tasklean_tz";

// What a reader gets until their browser has written the cookie, which is their
// first document and nothing after it.
export const FALLBACK_TIME_ZONE = "UTC";

// 400 days, the ceiling Chrome enforces, matching the theme cache beside it.
export const ZONE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

// An IANA name ("Europe/Ljubljana", "UTC") or a fixed offset, and nothing with
// room for anything else: this value is read from a cookie, so it is caller
// controlled and it reaches a formatter.
const ZONE_SHAPE = /^[A-Za-z0-9+_:/-]{1,64}$/;

/**
 * Says whether a value is a zone this runtime can format in.
 *
 * @param value The candidate, typically out of a cookie or the browser.
 * @returns True only for a zone `Intl` accepts, which is the whole check: the
 * platform's own database is the authority on what exists.
 */
export function isTimeZone(value: string | null | undefined): value is string {
  if (!value || !ZONE_SHAPE.test(value)) return false;

  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Narrows a value to a zone that can be drawn in.
 *
 * @returns The zone, or UTC for anything this runtime does not know. A reader
 * never sees an error over a zone: they see the wrong one at worst.
 */
export function asTimeZone(value: string | null | undefined): string {
  return isTimeZone(value) ? value : FALLBACK_TIME_ZONE;
}
