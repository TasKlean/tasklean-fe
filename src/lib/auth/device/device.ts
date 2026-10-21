/**
 * The stable per-browser id the backend binds a session to, and the headers
 * that carry it. A cookie, not browser storage: refresh runs in Proxy, which
 * can read a cookie and cannot reach localStorage.
 */

import "server-only";

import { cookies, headers } from "next/headers";

export const DEVICE_COOKIE_NAME = "tasklean_device";

// The backend's RequestContext reads these. It falls back to the transport
// User-Agent, which on a server-to-server hop is Node's, not the browser's.
const DEVICE_ID_HEADER = "X-Device-Id";
const DEVICE_USER_AGENT_HEADER = "X-Device-User-Agent";
const FORWARDED_FOR_HEADER = "X-Forwarded-For";

// 400 days, the ceiling Chrome enforces, and Proxy re-sets it on every
// rotation, so only a dormant browser ever ages out of its own identity.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

/**
 * Shared with `proxy.ts`, which mints the id and writes it onto a
 * `NextResponse` rather than through `cookies()`. The two must not drift.
 */
export const DEVICE_COOKIE_OPTIONS = {
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

export type DeviceHeaders = Record<string, string>;

/** Mints a device id. Opaque to the backend, which only matches it to itself. */
export function createDeviceId(): string {
  return crypto.randomUUID();
}

/**
 * Builds the device headers, omitting any part the request did not carry.
 *
 * @returns A header bag for `request()`. Empty is valid: the backend treats a
 * sign-in with no device id as one that simply has no device.
 */
export function buildDeviceHeaders({
  deviceId,
  userAgent,
  forwardedFor,
}: {
  deviceId?: string | null;
  userAgent?: string | null;
  forwardedFor?: string | null;
}): DeviceHeaders {
  const built: DeviceHeaders = {};
  if (deviceId) built[DEVICE_ID_HEADER] = deviceId;
  if (userAgent) built[DEVICE_USER_AGENT_HEADER] = userAgent;
  if (forwardedFor) built[FORWARDED_FOR_HEADER] = forwardedFor;
  return built;
}

/**
 * Reads the device headers off the incoming request, for a Server Action.
 *
 * Read only, and deliberately so: Proxy is the one place that mints the id,
 * because a Server Component render cannot write a cookie at all.
 *
 * @returns The headers to pass to an auth or account call.
 */
export async function deviceHeaders(): Promise<DeviceHeaders> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  return buildDeviceHeaders({
    deviceId: cookieStore.get(DEVICE_COOKIE_NAME)?.value,
    userAgent: headerList.get("user-agent"),
    // Passed through rather than rewritten: we are one more proxy in the chain,
    // and the backend walks it to find the client.
    forwardedFor: headerList.get("x-forwarded-for"),
  });
}
