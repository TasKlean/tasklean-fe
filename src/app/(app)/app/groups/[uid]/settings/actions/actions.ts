/**
 * A group's own Server Actions: its details, its invite code and its end. All
 * three are admin-only at the backend, so each reports a refusal where it was
 * pressed rather than assuming the role the page gated on still holds.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure/action-failure";
import { deleteGroup, rotateInviteCode, updateGroup } from "@/lib/groups/groups";
import { parseGroupAction } from "@/lib/validation/forms/group-action.schema";
import {
  echoGroupDetails,
  parseGroupDetails,
  type GroupDetailsErrors,
  type GroupDetailsFields,
} from "@/lib/validation/forms/group-details.schema/group-details.schema";

export type GroupDetailsState = {
  error: string | null;
  saved: boolean;
  fieldErrors?: GroupDetailsErrors;
  // Echoed so a submit without JS keeps what was typed.
  values?: GroupDetailsFields;
};

export type GroupActionState = {
  error: string | null;
};

/** Reads the group a press was about, which rides in the form like any other field. */
function parseGroup(formData: FormData): string | null {
  const parsed = parseGroupAction(Object.fromEntries(formData));

  return parsed.ok ? parsed.values.groupUid : null;
}

/** Re-renders every screen a group's own details show up on. */
function revalidateGroup(groupUid: string): void {
  revalidatePath(`/app/groups/${encodeURIComponent(groupUid)}`, "layout");
  revalidatePath("/app");
}

/**
 * Saves a group's name and description.
 *
 * @returns The saved state, or the failure to show above the form.
 */
export async function updateGroupDetailsAction(
  _previous: GroupDetailsState,
  formData: FormData,
): Promise<GroupDetailsState> {
  const submitted = Object.fromEntries(formData);
  const values = echoGroupDetails(submitted);
  const groupUid = parseGroup(formData);

  if (!groupUid) return { error: GENERIC_FAILURE, saved: false, values };

  const parsed = parseGroupDetails(submitted);
  if (!parsed.ok) return { error: null, saved: false, fieldErrors: parsed.errors, values };

  try {
    await updateGroup(groupUid, parsed.values);
  } catch (error) {
    return { error: actionFailureMessage(error), saved: false, values };
  }

  revalidateGroup(groupUid);
  return { error: null, saved: true };
}

/**
 * Issues a new invite code, which makes the old one stop working.
 *
 * @returns The failure to show on the card, or nothing to say: the new code
 * arrives through the re-render rather than through this state.
 */
export async function rotateInviteCodeAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupUid = parseGroup(formData);
  if (!groupUid) return { error: GENERIC_FAILURE };

  try {
    await rotateInviteCode(groupUid);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  revalidateGroup(groupUid);
  return { error: null };
}

/**
 * Deletes a group, with everything in it.
 *
 * @returns The failure to show. A success never returns: the group is gone from
 * under this screen, so it leaves for the list.
 */
export async function deleteGroupAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupUid = parseGroup(formData);
  if (!groupUid) return { error: GENERIC_FAILURE };

  try {
    await deleteGroup(groupUid);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  revalidatePath("/app");
  // Outside the try: redirect() signals by throwing.
  redirect("/app?deleted=1");
}
