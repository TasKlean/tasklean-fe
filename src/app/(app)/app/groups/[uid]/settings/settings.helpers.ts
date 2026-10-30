/**
 * The read the admin-only settings sections share. A member who reaches one of
 * them is sent to the section that is theirs rather than shown a refusal: the
 * entries are not in their rail at all, so arriving here means a stale link.
 */

import { redirect } from "next/navigation";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import type { Group } from "@/lib/groups/groups.types";
import { isGroupAdmin } from "@/lib/groups/role/role";

/**
 * Loads a group for a section only its admins may see.
 *
 * @returns The group, or null when the shell has already reported that it would
 * not load, in which case the page renders nothing.
 */
export async function loadAdminGroup(uid: string): Promise<Group | null> {
  const { group } = await loadGroup(uid);

  if (!group) return null;
  if (!isGroupAdmin(group.myRole)) {
    redirect(`/app/groups/${encodeURIComponent(uid)}/settings/preferences`);
  }

  return group;
}
