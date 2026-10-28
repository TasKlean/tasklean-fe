/**
 * The create-group Server Action. A success leaves this screen for the new
 * group, which is where its invite code is, so there is nothing to report back.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { createGroup } from "@/lib/groups/groups";
import type { Group } from "@/lib/groups/groups.types";
import {
  echoGroupDetails,
  parseGroupDetails,
  type GroupDetailsErrors,
  type GroupDetailsFields,
} from "@/lib/validation/forms/group-details.schema/group-details.schema";

export type CreateGroupState = {
  error: string | null;
  fieldErrors?: GroupDetailsErrors;
  // Echoed so a submit without JS keeps what was typed.
  values?: GroupDetailsFields;
};

/**
 * Creates a group with the caller as its first admin.
 *
 * @returns The failure to show. A success never returns: it redirects into the
 * new group.
 */
export async function createGroupAction(
  _previous: CreateGroupState,
  formData: FormData,
): Promise<CreateGroupState> {
  const submitted = Object.fromEntries(formData);
  const values = echoGroupDetails(submitted);

  const parsed = parseGroupDetails(submitted);
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors, values };

  let group: Group;
  try {
    group = await createGroup(parsed.values);
  } catch (error) {
    return { error: actionFailureMessage(error), values };
  }

  revalidatePath("/app");
  // The group exists either way, so a response that carried no uid goes to the
  // list rather than reporting a failure that did not happen.
  redirect(group.uid ? `/app/groups/${encodeURIComponent(group.uid)}` : "/app");
}
