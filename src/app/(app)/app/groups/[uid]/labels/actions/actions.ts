/**
 * The labels screen's Server Actions: adding, saving and deleting a category or
 * a tag. Each one reports its own refusal where it was pressed, because the
 * permissions differ per control and the role the screen gated on may no longer
 * hold by the time a press lands.
 *
 * A 409 means two different things here, told apart by the call that was made:
 * a name already taken on a create or a save, and tasks still filed under a
 * category on a delete. Neither carries a code.
 */

"use server";

import { revalidatePath } from "next/cache";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { GENERIC_FAILURE } from "@/lib/api/errors";
import { createCategory, deleteCategory, updateCategory } from "@/lib/labels/categories/categories";
import { categoryInUseMessage, labelNameTakenMessage } from "@/lib/labels/refusals/refusals";
import { createTag, deleteTag, updateTag } from "@/lib/labels/tags/tags";
import {
  echoCategory,
  parseCreateCategory,
  parseEditCategory,
  type CategoryErrors,
  type CategoryValues,
} from "@/lib/validation/forms/category.schema/category.schema";
import { parseLabelAction } from "@/lib/validation/forms/label-action.schema/label-action.schema";
import {
  echoTag,
  parseCreateTag,
  parseEditTag,
  type TagErrors,
  type TagValues,
} from "@/lib/validation/forms/tag.schema/tag.schema";

export type CategoryFormState = {
  error: string | null;
  // What closes a row's editor, and what clears the add form.
  saved: boolean;
  fieldErrors?: CategoryErrors;
  // Echoed so a submit without JS keeps what was typed.
  values?: CategoryValues;
};

export type TagFormState = {
  error: string | null;
  saved: boolean;
  fieldErrors?: TagErrors;
  values?: TagValues;
};

export type LabelActionState = {
  error: string | null;
};

/**
 * Re-renders every screen a label shows up on.
 *
 * The layout rather than the page: a label is drawn on the board as well as on
 * the screen it is managed from, so a rename has to reach both.
 */
function revalidateLabels(groupUid: string): void {
  revalidatePath(`/app/groups/${encodeURIComponent(groupUid)}`, "layout");
}

/**
 * Adds a category, or brings back the deleted one holding the name.
 *
 * @returns The saved state, or the failure. A taken name lands on the field
 * rather than above the form, because that is the field to change.
 */
export async function createCategoryAction(
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const submitted = Object.fromEntries(formData);
  const values = echoCategory(submitted);
  const parsed = parseCreateCategory(submitted);

  if (!parsed.ok) return { error: null, saved: false, fieldErrors: parsed.errors, values };

  try {
    await createCategory(parsed.values);
  } catch (error) {
    const taken = labelNameTakenMessage(error);
    if (taken) return { error: null, saved: false, fieldErrors: { name: taken }, values };

    return { error: actionFailureMessage(error), saved: false, values };
  }

  revalidateLabels(parsed.values.groupUid);
  return { error: null, saved: true };
}

/**
 * Saves a category's name, colour and icon.
 *
 * @returns The saved state, or the failure. The whole category is sent, so a
 * field the reader did not touch is posted back as it stands.
 */
export async function updateCategoryAction(
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const submitted = Object.fromEntries(formData);
  const values = echoCategory(submitted);
  const parsed = parseEditCategory(submitted);

  if (!parsed.ok) return { error: null, saved: false, fieldErrors: parsed.errors, values };

  const { groupUid, id, ...fields } = parsed.values;

  try {
    await updateCategory(id, fields);
  } catch (error) {
    const taken = labelNameTakenMessage(error);
    if (taken) return { error: null, saved: false, fieldErrors: { name: taken }, values };

    return { error: actionFailureMessage(error), saved: false, values };
  }

  revalidateLabels(groupUid);
  return { error: null, saved: true };
}

/**
 * Deletes a category, which the backend refuses while tasks are filed under it.
 *
 * @returns The failure to show on the row. A success says nothing: the row is
 * gone from the list the re-render draws.
 */
export async function deleteCategoryAction(
  _previous: LabelActionState,
  formData: FormData,
): Promise<LabelActionState> {
  const parsed = parseLabelAction(Object.fromEntries(formData));
  if (!parsed.ok) return { error: GENERIC_FAILURE };

  try {
    await deleteCategory(parsed.values.id);
  } catch (error) {
    return { error: categoryInUseMessage(error) ?? actionFailureMessage(error) };
  }

  revalidateLabels(parsed.values.groupUid);
  return { error: null };
}

/**
 * Adds a tag, or brings back the deleted one holding the name.
 *
 * @returns The saved state, or the failure.
 */
export async function createTagAction(
  _previous: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const submitted = Object.fromEntries(formData);
  const values = echoTag(submitted);
  const parsed = parseCreateTag(submitted);

  if (!parsed.ok) return { error: null, saved: false, fieldErrors: parsed.errors, values };

  try {
    await createTag(parsed.values);
  } catch (error) {
    const taken = labelNameTakenMessage(error);
    if (taken) return { error: null, saved: false, fieldErrors: { name: taken }, values };

    return { error: actionFailureMessage(error), saved: false, values };
  }

  revalidateLabels(parsed.values.groupUid);
  return { error: null, saved: true };
}

/**
 * Saves a tag's name and colour.
 *
 * @returns The saved state, or the failure. A member's save carries the name
 * unchanged, which is what keeps the backend from refusing the body: it splits
 * this one request by field, and only an admin may move the name.
 */
export async function updateTagAction(
  _previous: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const submitted = Object.fromEntries(formData);
  const values = echoTag(submitted);
  const parsed = parseEditTag(submitted);

  if (!parsed.ok) return { error: null, saved: false, fieldErrors: parsed.errors, values };

  const { groupUid, id, ...fields } = parsed.values;

  try {
    await updateTag(id, fields);
  } catch (error) {
    const taken = labelNameTakenMessage(error);
    if (taken) return { error: null, saved: false, fieldErrors: { name: taken }, values };

    return { error: actionFailureMessage(error), saved: false, values };
  }

  revalidateLabels(groupUid);
  return { error: null, saved: true };
}

/**
 * Deletes a tag, whatever is carrying it.
 *
 * @returns The failure to show on the row. Nothing stands in the way here, so
 * there is no refusal of its own to phrase.
 */
export async function deleteTagAction(
  _previous: LabelActionState,
  formData: FormData,
): Promise<LabelActionState> {
  const parsed = parseLabelAction(Object.fromEntries(formData));
  if (!parsed.ok) return { error: GENERIC_FAILURE };

  try {
    await deleteTag(parsed.values.id);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  revalidateLabels(parsed.values.groupUid);
  return { error: null };
}
