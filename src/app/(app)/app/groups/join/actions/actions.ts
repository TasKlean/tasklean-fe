/**
 * The join-group Server Action. Three refusals matter here and none of them
 * carries a code, so each is told apart by its status: 404 is the code, 409 is
 * a group the caller is already in, and 429 is the tighter join bucket.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { isApiError } from "@/lib/api/errors";
import { joinGroup } from "@/lib/groups/groups";
import type { MyGroup } from "@/lib/groups/groups.types";
import { parseJoinGroup } from "@/lib/validation/forms/join-group.schema/join-group.schema";

export type JoinGroupState = {
  error: string | null;
  fieldErrors?: { inviteCode?: string };
  // The 409. A flag rather than a message, because the screen answers it with a
  // link, and the error carries no uid to send anyone straight to.
  alreadyMember?: boolean;
  // Echoed so a submit without JS keeps what was typed.
  inviteCode?: string;
};

// Said the same way for an unknown code and for a deleted group's code, so a
// redeemer cannot discover which codes once worked.
const REFUSED = "That code is not valid. Check it with whoever shared it.";

/**
 * Redeems an invite code.
 *
 * @returns The failure to show. A success never returns: it redirects into the
 * group that was joined.
 */
export async function joinGroupAction(
  _previous: JoinGroupState,
  formData: FormData,
): Promise<JoinGroupState> {
  const submitted = Object.fromEntries(formData);
  const typed = typeof submitted.inviteCode === "string" ? submitted.inviteCode : "";

  const parsed = parseJoinGroup(submitted);
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors, inviteCode: typed };

  let group: MyGroup;
  try {
    group = await joinGroup(parsed.values.inviteCode);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return { error: null, fieldErrors: { inviteCode: REFUSED }, inviteCode: typed };
    }
    if (isApiError(error) && error.status === 409) {
      return { error: null, alreadyMember: true, inviteCode: typed };
    }
    return { error: actionFailureMessage(error), inviteCode: typed };
  }

  revalidatePath("/app");
  redirect(group.uid ? `/app/groups/${encodeURIComponent(group.uid)}` : "/app");
}
