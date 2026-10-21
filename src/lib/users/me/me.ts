/**
 * The signed-in user's own profile. Two entry points on purpose: a page has a
 * session, while a sign-in action holds a token the cookie does not carry yet.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import { serverApi } from "@/lib/api/server/server";

// Hand-written from the backend's UserResponse. Nothing is marked `required`
// in openapi.json, so every field is optional and narrowed where it is used.
export type CurrentUser = {
  uid?: string;
  email?: string;
  name?: string;
  middleName?: string;
  lastName?: string;
  photoUrl?: string;
  isEmailVerified?: boolean;
  dateCreated?: string;
};

const PATH = "/api/users/me";

/**
 * Reads the profile with an explicit token, before a session cookie exists.
 *
 * @throws ApiError on any non-2xx.
 */
export async function fetchProfile(accessToken: string): Promise<CurrentUser> {
  return request<CurrentUser>(PATH, { accessToken });
}

/**
 * Reads the current session's profile.
 *
 * @throws SessionExpiredError when the session is gone or refused.
 * @throws ApiError for every other failure.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return serverApi<CurrentUser>(PATH);
}
