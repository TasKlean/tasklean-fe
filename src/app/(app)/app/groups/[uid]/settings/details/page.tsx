import type { Metadata } from "next";
import { loadAdminGroup } from "@/app/(app)/app/groups/[uid]/settings/settings.helpers";
import { EditGroupForm } from "@/components/app/group/settings/edit-group-form/edit-group-form";
import { SettingsSection } from "@/components/app/group/settings/settings-section";

export const metadata: Metadata = {
  title: "Group details",
};

/** Renders the name, description and picture everybody in the group sees. */
export default async function GroupDetailsPage({
  params,
}: PageProps<"/app/groups/[uid]/settings/details">) {
  const { uid } = await params;
  const group = await loadAdminGroup(uid);

  if (!group) return null;

  return (
    <SettingsSection
      title="Group details"
      description="The name, description and picture everybody in this group sees."
    >
      <EditGroupForm
        groupUid={uid}
        name={group.name ?? ""}
        description={group.description ?? ""}
        photoUrl={group.photoUrl ?? ""}
      />
    </SettingsSection>
  );
}
