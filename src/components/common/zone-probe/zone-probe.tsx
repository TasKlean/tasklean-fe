/**
 * Tells the server which zone this browser is in, by writing the cookie the
 * server reads. The browser is the only party that knows: no API field holds a
 * zone and no request header carries one, so a first document is drawn in UTC
 * and asked for again once the cookie is there.
 *
 * Renders nothing.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isTimeZone, ZONE_COOKIE_NAME, ZONE_MAX_AGE_SECONDS } from "@/lib/time/zone/zone";

/** Reads one cookie in the browser. */
function readCookie(name: string): string | undefined {
  const match = document.cookie.split("; ").find((pair) => pair.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/** Writes the zone cookie, once per zone a browser reports. */
export function ZoneProbe() {
  const router = useRouter();

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!isTimeZone(zone) || readCookie(ZONE_COOKIE_NAME) === zone) return;

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${ZONE_COOKIE_NAME}=${encodeURIComponent(zone)}; path=/; max-age=${ZONE_MAX_AGE_SECONDS}; samesite=lax${secure}`;

    // Checked rather than assumed: where cookies are blocked the write is a
    // silent no-op, and refreshing on that would ask for the page forever.
    if (readCookie(ZONE_COOKIE_NAME) !== zone) return;

    router.refresh();
  }, [router]);

  return null;
}
