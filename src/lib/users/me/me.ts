/**
 * The signed-in user's own profile: two ways to read it, and the one way to
 * change it. Two reads on purpose: a page has a session, while a sign-in action
 * holds a token the cookie does not carry yet.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import { serverApi } from "@/lib/api/server/server";
import type { DeviceHeaders } from "@/lib/auth/device/device";
import type { CurrentUser, UpdateProfileRequest } from "@/lib/users/me/me.types";

const USERS_PATH = "/api/users";

// No identifier of its own: the subject comes off the token, so a read cannot
// name anybody else's account.
const ME_PATH = `${USERS_PATH}/me`;

/**
 * Reads the profile with an explicit token, before a session cookie exists.
 *
 * @param device Device headers, so this read is attributed to the end user.
 * @throws ApiError on any non-2xx.
 */
export async function fetchProfile(
  accessToken: string,
  device: DeviceHeaders = {},
): Promise<CurrentUser> {
  return request<CurrentUser>(ME_PATH, { accessToken, headers: device });
}

/**
 * Reads the current session's profile.
 *
 * @throws SessionExpiredError when the session is gone or refused.
 * @throws ApiError for every other failure.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return serverApi<CurrentUser>(ME_PATH);
}

/**
 * Saves a profile, replacing every field it is sent.
 *
 * @param uid The subject's user uid, which the caller takes from the session
 * rather than from anything posted: only the subject may send a `photoUid`, and
 * a body carrying one for somebody else is refused outright.
 * @returns The profile as it now stands, so a caller can reseal the chrome from
 * it without reading again.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 400 carrying `UPLOAD_NOT_USABLE` is the picture being refused, whichever of
 * the backend's checks caught it, and a 403 means the uid is not the caller's.
 */
export async function updateProfile(
  uid: string,
  fields: UpdateProfileRequest,
): Promise<CurrentUser> {
  return serverApi<CurrentUser>(`${USERS_PATH}/${encodeURIComponent(uid)}`, {
    method: "PUT",
    body: fields,
  });
}
