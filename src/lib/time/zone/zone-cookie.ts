/**
 * Reading the zone cache on the server. Its own module because `next/headers`
 * is server-only and the component that writes the cookie runs in the browser.
 */

import "server-only";

import { cookies } from "next/headers";
import { asTimeZone, ZONE_COOKIE_NAME } from "@/lib/time/zone/zone";

/**
 * Reads the zone this browser reported.
 *
 * @returns The cached zone, or UTC when there is nothing usable, which is a
 * first visit and a reader who blocks cookies alike.
 */
export async function readTimeZone(): Promise<string> {
  return asTimeZone((await cookies()).get(ZONE_COOKIE_NAME)?.value);
}
