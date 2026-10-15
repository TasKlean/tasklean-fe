/**
 * The caller's own devices and sign-in sessions. Every call carries the device
 * headers: the backend resolves `currentDevice` from the header, not from the
 * token, so without them no row knows it is the browser asking.
 */

import "server-only";

import { serverApi } from "@/lib/api/server";
import { deviceHeaders } from "@/lib/auth/device";
import { parseApiDateOrNull } from "@/lib/time/api-date";

// Hand-written from the backend's MyDeviceResponse. Nothing is marked
// `required` in openapi.json, so every field is narrowed where it is used.
export type MyDevice = {
  id?: number;
  deviceName?: string;
  // The user-agent parser emits "mobile" or "desktop", but push registration
  // writes "ANDROID", "IOS" or "WEB" into the same column.
  deviceType?: string;
  browserInfo?: string;
  osVersion?: string;
  ipAddress?: string;
  lastUsed?: string;
  activeSession?: boolean;
  currentDevice?: boolean;
  dateCreated?: string;
};

const MOBILE_TYPES = new Set(["mobile", "android", "ios"]);

/**
 * Reports whether a device should read as a phone rather than a computer.
 *
 * @returns False for anything unrecognised, so an unknown type gets the
 * neutral computer icon rather than a confidently wrong one.
 */
export function isMobileDevice(device: MyDevice): boolean {
  return MOBILE_TYPES.has(device.deviceType?.trim().toLowerCase() ?? "");
}

/**
 * Orders this browser first, then by most recent use.
 *
 * @returns A comparator. A device with no readable `lastUsed` sorts last
 * rather than jumping to the top as epoch zero.
 */
function byRecency(left: MyDevice, right: MyDevice): number {
  if (left.currentDevice !== right.currentDevice) return left.currentDevice ? -1 : 1;

  const leftUsed = parseApiDateOrNull(left.lastUsed)?.getTime() ?? 0;
  const rightUsed = parseApiDateOrNull(right.lastUsed)?.getTime() ?? 0;
  return rightUsed - leftUsed;
}

/**
 * Lists the caller's devices.
 *
 * The backend returns them unordered, so they are sorted here, which is where
 * every other ordering in this app lives.
 *
 * @returns Every device the backend still considers active, including ones
 * with no live session, which stay listed until they are removed.
 * @throws SessionExpiredError when the session is gone or refused.
 */
export async function listMyDevices(): Promise<MyDevice[]> {
  const devices = await serverApi<MyDevice[]>("/api/devices", {
    headers: await deviceHeaders(),
  });

  return Array.isArray(devices) ? [...devices].sort(byRecency) : [];
}

/**
 * Ends the session on one device, leaving the device listed as inactive.
 *
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function logoutDevice(id: number): Promise<void> {
  await serverApi<void>(`/api/devices/${id}/logout`, {
    method: "POST",
    headers: await deviceHeaders(),
  });
}

/**
 * Removes a device and revokes any session on it.
 *
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function removeDevice(id: number): Promise<void> {
  await serverApi<void>(`/api/devices/${id}`, {
    method: "DELETE",
    headers: await deviceHeaders(),
  });
}
