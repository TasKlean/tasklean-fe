/**
 * The stable per-browser id the backend binds a session to, and the headers
 * that carry it. A cookie, not browser storage: refresh runs in Proxy, which
 * can read a cookie and cannot reach localStorage.
 *
 * The end user's address rides here too, because every API call is a
 * server-to-server hop and the backend's own socket sees Cloudflare's edge.
 */

import "server-only";

import { cookies, headers } from "next/headers";
import { getEnv } from "@/lib/config/env/env";

export const DEVICE_COOKIE_NAME = "tasklean_device";

// The backend's RequestContext reads these. It falls back to the transport
// User-Agent, which on a server-to-server hop is Node's, not the browser's.
const DEVICE_ID_HEADER = "X-Device-Id";
const DEVICE_USER_AGENT_HEADER = "X-Device-User-Agent";

// Its ClientIpResolver reads this pair. Any caller can claim an address, so the
// secret is what makes the backend honour ours rather than ignore it.
const DEVICE_IP_HEADER = "X-Device-Ip";
const HOP_SECRET_HEADER = "X-Internal-Hop";

// The longest IPv6 literal, and the width of the backend's ip_address column,
// so anything longer would fail its insert rather than be stored.
const MAX_IP_LENGTH = 45;

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
 * Narrows a forwarded address to a single bare literal.
 *
 * @returns The address, or null for anything else. The hop secret rides with
 * this value, so a comma-joined chain would launder a caller-chosen entry into
 * one the backend trusts.
 */
function bareIp(value: string | null | undefined): string | null {
  if (!value) return null;

  const candidate = value.trim();
  if (candidate.length === 0 || candidate.length > MAX_IP_LENGTH) return null;

  // Hex digits, dots and colons spell every IPv4 and IPv6 literal, and nothing
  // carrying a comma, a space or a zone id.
  return /^[0-9a-f.:]+$/i.test(candidate) ? candidate : null;
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
  deviceIp,
}: {
  deviceId?: string | null;
  userAgent?: string | null;
  deviceIp?: string | null;
}): DeviceHeaders {
  const built: DeviceHeaders = {};
  if (deviceId) built[DEVICE_ID_HEADER] = deviceId;
  if (userAgent) built[DEVICE_USER_AGENT_HEADER] = userAgent;

  const ip = bareIp(deviceIp);
  if (ip) {
    built[DEVICE_IP_HEADER] = ip;
    // The secret vouches for the address above and for nothing else, so it
    // never rides without one.
    built[HOP_SECRET_HEADER] = getEnv().BFF_HOP_SECRET;
  }

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
    // Cloudflare sets this from the TCP peer, so a browser cannot choose it.
    // X-Forwarded-For is appended to, leaving its leftmost entry caller-chosen.
    deviceIp: headerList.get("cf-connecting-ip"),
  });
}
