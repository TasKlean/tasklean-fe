/**
 * The roster's Server Actions: a role change, a removal, and the leave that is
 * the same call aimed at your own membership. Each reports its own failure to
 * the row that made it, so a refusal never takes the page, and each phrases the
 * 409 itself, since the last-admin guard is the one failure with a fix to name.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure/action-failure";
import { lastAdminMessage } from "@/lib/groups/last-admin/last-admin";
import { changeMemberRole, removeMember } from "@/lib/groups/members/members";
import {
  parseMemberAction,
  parseMemberRole,
} from "@/lib/validation/forms/member-action.schema/member-action.schema";

export type MemberActionState = {
  error: string | null;
};

/**
 * Re-renders everything a membership change shows up in.
 *
 * The rail's member count and the list's cards come from the group read rather
 * than from the roster, so the whole group goes rather than just this page.
 */
function revalidateGroup(groupUid: string): void {
  revalidatePath(`/app/groups/${encodeURIComponent(groupUid)}`, "layout");
  revalidatePath("/app");
}

/** Reports what a membership call refused, naming the guard where there is one. */
function failure(error: unknown): MemberActionState {
  return { error: lastAdminMessage(error) ?? actionFailureMessage(error) };
}

/**
 * Promotes a member to admin, or puts an admin back to member.
 *
 * @returns The failure to show on the row, or nothing to say.
 */
export async function changeMemberRoleAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const parsed = parseMemberRole(Object.fromEntries(formData));
  if (!parsed.ok) {
    return {
      error:
        parsed.errors.memberUid ?? parsed.errors.role ?? parsed.errors.groupUid ?? GENERIC_FAILURE,
    };
  }

  try {
    await changeMemberRole(parsed.values.memberUid, parsed.values.role);
  } catch (error) {
    return failure(error);
  }

  revalidateGroup(parsed.values.groupUid);
  return { error: null };
}

/**
 * Removes someone else from the group.
 *
 * @returns The failure to show on the row, or nothing to say.
 */
export async function removeMemberAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const parsed = parseMemberAction(Object.fromEntries(formData));
  if (!parsed.ok) {
    return { error: parsed.errors.memberUid ?? parsed.errors.groupUid ?? GENERIC_FAILURE };
  }

  try {
    await removeMember(parsed.values.memberUid);
  } catch (error) {
    return failure(error);
  }

  revalidateGroup(parsed.values.groupUid);
  return { error: null };
}

/**
 * Ends the caller's own membership, which is the same call with their own uid.
 *
 * @returns The failure to show. A success never returns: the group is gone from
 * under this screen, so it leaves for the list.
 */
export async function leaveGroupAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const parsed = parseMemberAction(Object.fromEntries(formData));
  if (!parsed.ok) {
    return { error: parsed.errors.memberUid ?? parsed.errors.groupUid ?? GENERIC_FAILURE };
  }

  try {
    await removeMember(parsed.values.memberUid);
  } catch (error) {
    return failure(error);
  }

  revalidateGroup(parsed.values.groupUid);
  // Outside the try: redirect() signals by throwing.
  redirect("/app?left=1");
}
