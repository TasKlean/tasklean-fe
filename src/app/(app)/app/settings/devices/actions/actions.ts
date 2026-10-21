/**
 * The device buttons' Server Actions. Each one reports its own failure back to
 * the row that called it, so a refused removal never takes the page down.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure/action-failure";
import { deviceHeaders } from "@/lib/auth/device/device";
import { clearSession, getSession } from "@/lib/auth/session/session";
import { revokeAllSessions } from "@/lib/auth/tokens/logout/logout";
import { listMyDevices, logoutDevice, removeDevice } from "@/lib/devices/devices";
import { parseDeviceAction } from "@/lib/validation/forms/device-action.schema";

export type DeviceActionState = {
  error: string | null;
};

const DEVICES_PATH = "/app/settings/devices";

/**
 * Reports whether a device is the browser making this request.
 *
 * Asked of the backend rather than of the form, so a tampered field cannot
 * sign anyone out, and answered `false` when unknown, so an unreadable list
 * leaves the session alone instead of ending it.
 */
async function isThisBrowser(deviceId: number): Promise<boolean> {
  try {
    const devices = await listMyDevices();
    return devices.some((device) => device.id === deviceId && device.currentDevice === true);
  } catch {
    return false;
  }
}

/**
 * Ends the session on one device, leaving the device listed.
 *
 * Ending this browser's own session has to clear the cookie too. The backend
 * only revokes refresh tokens, so the access token in the cookie keeps working
 * until it expires, which in dev is a year: without this the page would claim
 * you were still signed in.
 */
export async function signOutDeviceAction(
  _previous: DeviceActionState,
  formData: FormData,
): Promise<DeviceActionState> {
  const parsed = parseDeviceAction(Object.fromEntries(formData));
  if (!parsed.ok) return { error: parsed.errors.deviceId ?? GENERIC_FAILURE };

  const ourOwn = await isThisBrowser(parsed.values.deviceId);

  try {
    await logoutDevice(parsed.values.deviceId);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  if (ourOwn) {
    await clearSession();
    // Outside the try: redirect() signals by throwing.
    redirect("/login?signedOut=device");
  }

  revalidatePath(DEVICES_PATH);
  return { error: null };
}

/**
 * Removes a device and revokes whatever session it held.
 *
 * Removing this browser ends its own session, so it leaves the same way a
 * sign-out does. That also covers emptying the list: the only device you can
 * remove last is your own.
 */
export async function removeDeviceAction(
  _previous: DeviceActionState,
  formData: FormData,
): Promise<DeviceActionState> {
  const parsed = parseDeviceAction(Object.fromEntries(formData));
  if (!parsed.ok) return { error: parsed.errors.deviceId ?? GENERIC_FAILURE };

  const ourOwn = await isThisBrowser(parsed.values.deviceId);

  try {
    await removeDevice(parsed.values.deviceId);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  if (ourOwn) {
    await clearSession();
    // Outside the try: redirect() signals by throwing.
    redirect("/login?signedOut=device");
  }

  revalidatePath(DEVICES_PATH);
  return { error: null };
}

/**
 * Ends every session, this browser's included, and sends them to sign in again.
 *
 * Unlike ordinary logout this one reports failure rather than swallowing it:
 * someone pressing it believes every other session is gone, and a silent
 * failure would leave them believing it wrongly.
 */
export async function signOutEverywhereAction(
  _previous: DeviceActionState,
): Promise<DeviceActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await revokeAllSessions(session.refreshToken, await deviceHeaders());
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  await clearSession();
  // Outside the try: redirect() signals by throwing.
  redirect("/login?signedOut=all");
}
