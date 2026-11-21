/**
 * A household's task categories. The list is scoped by the path rather than by
 * a `?groupId=`, while the three writes address one category by its numeric id
 * and carry no group at all.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from "@/lib/labels/categories/categories.types";

const CATEGORIES_PATH = "/api/categories";

/** Builds the path to one category, which is addressed by a numeric id. */
function categoryPath(id: number): string {
  return `${CATEGORIES_PATH}/${id}`;
}

/**
 * Lists a household's categories, in name order.
 *
 * @returns Every live category. A deleted one is gone from the list, and so is
 * anything a task is still filed under only if it was deleted first, which the
 * backend refuses.
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 403 means the group is not the caller's or does not exist alike.
 */
export async function getCategories(groupUid: string): Promise<Category[]> {
  const categories = await serverApi<Category[]>(
    `/api/groups/${encodeURIComponent(groupUid)}/categories`,
  );

  return Array.isArray(categories) ? categories : [];
}

/**
 * Creates a category, or revives the deleted one already holding the name.
 *
 * @returns The category, which keeps its original id and colour when it was a
 * revival, with every task still filed under it.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 409 is a live category already holding the name, and a 403 is a member: the
 * filing system is the household's, so adding to it is an admin's.
 */
export async function createCategory(fields: CategoryCreateRequest): Promise<Category> {
  return serverApi<Category>(CATEGORIES_PATH, { method: "POST", body: fields });
}

/**
 * Saves a category's name, colour and icon.
 *
 * @param fields Everything the category will then hold: the backend replaces
 * the lot, so an omitted colour takes it away.
 * @returns The category as the backend now holds it.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 409 is a name another category holds, a deleted one included, since reviving
 * a name is something only a create does.
 */
export async function updateCategory(id: number, fields: CategoryUpdateRequest): Promise<Category> {
  return serverApi<Category>(categoryPath(id), { method: "PUT", body: fields });
}

/**
 * Soft-deletes a category nothing is filed under.
 *
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 409 is tasks still carrying it, which is refused rather than cleared, and its
 * message is the only place the count of them arrives.
 */
export async function deleteCategory(id: number): Promise<void> {
  await serverApi<void>(categoryPath(id), { method: "DELETE" });
}
