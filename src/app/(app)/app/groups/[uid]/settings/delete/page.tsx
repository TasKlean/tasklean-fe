import type { Metadata } from "next";
import { loadAdminGroup } from "@/app/(app)/app/groups/[uid]/settings/settings.helpers";
import { DeleteGroup } from "@/components/app/group/settings/delete-group/delete-group";
import { SettingsSection } from "@/components/app/group/settings/settings-section";
import { groupLabel } from "@/lib/groups/labels/labels";

export const metadata: Metadata = {
  title: "Delete group",
};

/** Renders the end of a group, and the name it asks for before it does it. */
export default async function GroupDeletePage({
  params,
}: PageProps<"/app/groups/[uid]/settings/delete">) {
  const { uid } = await params;
  const group = await loadAdminGroup(uid);

  if (!group) return null;

  return (
    <SettingsSection
      title="Delete this group"
      description="The group, its tasks and everybody's membership go at once. This cannot be undone."
      tone="destructive"
    >
      <DeleteGroup groupUid={uid} name={groupLabel(group.name)} />
    </SettingsSection>
  );
}
