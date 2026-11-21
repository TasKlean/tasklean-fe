/**
 * Reading a household's labels. The two lists are read together and reported
 * separately: neither says anything about the other, so a failure costs one
 * section rather than the screen.
 */

import "server-only";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";
import { getCategories } from "@/lib/labels/categories/categories";
import type { Category } from "@/lib/labels/categories/categories.types";
import { getTags } from "@/lib/labels/tags/tags";
import type { Tag } from "@/lib/labels/tags/tags.types";

/** One section's rows, or the line shown in their place. */
export type LabelList<Item> = {
  items: Item[];
  failure: string | null;
};

export type LabelsView = {
  categories: LabelList<Category>;
  tags: LabelList<Tag>;
};

/**
 * Runs one list read, keeping its failure to itself.
 *
 * @throws A redirect for a dead session or a group that is not the reader's,
 * and anything that is not an `ApiError`: those are not one section's problem.
 */
async function readList<Item>(read: () => Promise<Item[]>): Promise<LabelList<Item>> {
  try {
    return { items: await read(), failure: null };
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    return { items: [], failure: error.message };
  }
}

/**
 * Reads both of a household's label lists.
 *
 * @param groupUid The group in the route.
 * @returns Each list with its own failure. Read together, because serially the
 * second would add its round trip to what the reader waits for.
 */
export async function loadLabels(groupUid: string): Promise<LabelsView> {
  const [categories, tags] = await Promise.all([
    readList(() => getCategories(groupUid)),
    readList(() => getTags(groupUid)),
  ]);

  return { categories, tags };
}
