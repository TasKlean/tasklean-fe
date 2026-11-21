/**
 * A household's task tags. Same shape as categories, with the permissions
 * split differently: creating and recolouring are any member's, renaming and
 * deleting an admin's, and the rename half of the PUT is what the backend
 * refuses rather than the call.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type { Tag, TagCreateRequest, TagUpdateRequest } from "@/lib/labels/tags/tags.types";

const TAGS_PATH = "/api/tags";

/** Builds the path to one tag, which is addressed by a numeric id. */
function tagPath(id: number): string {
  return `${TAGS_PATH}/${id}`;
}

/**
 * Lists a household's tags, in name order.
 *
 * @returns Every live tag. A deleted one is gone from the list while the tasks
 * that carried it keep their rows, which is what makes reviving a name bring
 * the label back where it was.
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 403 means the group is not the caller's or does not exist alike.
 */
export async function getTags(groupUid: string): Promise<Tag[]> {
  const tags = await serverApi<Tag[]>(`/api/groups/${encodeURIComponent(groupUid)}/tags`);

  return Array.isArray(tags) ? tags : [];
}

/**
 * Creates a tag, or revives the deleted one already holding the name.
 *
 * @returns The tag, which keeps its original id when it was a revival, with
 * every task that carried it carrying it again.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 409 is a live tag already holding the name.
 */
export async function createTag(fields: TagCreateRequest): Promise<Tag> {
  return serverApi<Tag>(TAGS_PATH, { method: "POST", body: fields });
}

/**
 * Saves a tag's name and colour.
 *
 * @param fields Everything the tag will then hold. The name has to be the one
 * it already carries unless the caller is an admin: the backend compares the
 * stored spelling exactly, so changing only its case is still a rename.
 * @returns The tag as the backend now holds it.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 409 is a name another tag holds, a deleted one included, and a 403 is a
 * member who sent a different name.
 */
export async function updateTag(id: number, fields: TagUpdateRequest): Promise<Tag> {
  return serverApi<Tag>(tagPath(id), { method: "PUT", body: fields });
}

/**
 * Soft-deletes a tag, whatever is carrying it.
 *
 * Unlike a category, nothing stands in the way: the tasks keep their rows and
 * simply stop showing the label, which is why this is an admin's press.
 *
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function deleteTag(id: number): Promise<void> {
  await serverApi<void>(tagPath(id), { method: "DELETE" });
}
