/**
 * The caller's own UI preferences. The API resource is `/api/user-settings` and
 * its PUT is a full replace, so a screen that edits one field sends both.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import { serverApi } from "@/lib/api/server/server";
import {
  asLocale,
  asTheme,
  type Preferences,
  type PreferencesResponse,
} from "@/lib/preferences/preferences.types";

const PATH = "/api/user-settings";

/** Narrows a response into a complete pair, defaulting anything unusable. */
function toPreferences(response: PreferencesResponse | undefined): Preferences {
  return { theme: asTheme(response?.theme), locale: asLocale(response?.locale) };
}

/**
 * Reads the preferences with an explicit token, before a session cookie exists.
 *
 * @throws ApiError on any non-2xx.
 */
export async function fetchPreferences(accessToken: string): Promise<Preferences> {
  return toPreferences(await request<PreferencesResponse>(PATH, { accessToken }));
}

/**
 * Reads the current session's preferences.
 *
 * @returns The saved pair, or the backend's defaults when none are saved yet.
 * @throws SessionExpiredError when the session is gone or refused.
 * @throws ApiError for every other failure.
 */
export async function getPreferences(): Promise<Preferences> {
  return toPreferences(await serverApi<PreferencesResponse>(PATH));
}

/**
 * Replaces both preferences.
 *
 * @param preferences Both fields, because the endpoint is a full replace: a
 * screen editing one of them sends the other back unchanged.
 * @returns What the backend saved, which is what the UI should believe.
 */
export async function savePreferences(preferences: Preferences): Promise<Preferences> {
  return toPreferences(
    await serverApi<PreferencesResponse>(PATH, { method: "PUT", body: preferences }),
  );
}
