/**
 * Loading the group a route is about, which the shell and every screen inside
 * it all need. One request pays for all of them: `getGroup` is memoised per
 * request, so the second caller gets the first one's promise.
 */

import "server-only";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroup } from "@/lib/groups/groups";
import type { Group } from "@/lib/groups/groups.types";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";

export type LoadedGroup = {
  group: Group | null;
  failure: string | null;
};

/**
 * Reads one group, turning the two failures that are not errors into redirects.
 *
 * @returns The group, or the message a failed load should report.
 * @throws Anything that is not an `ApiError`, which the route boundary owns.
 */
export async function loadGroup(uid: string): Promise<LoadedGroup> {
  try {
    return { group: await getGroup(uid), failure: null };
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    // A group that is someone else's and a uid that never existed are the same
    // 403, so neither is an error to report: both mean go back to the list.
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    return { group: null, failure: error.message };
  }
}
