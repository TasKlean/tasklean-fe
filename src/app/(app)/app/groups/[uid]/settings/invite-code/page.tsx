import type { Metadata } from "next";
import { loadAdminGroup } from "@/app/(app)/app/groups/[uid]/settings/settings.helpers";
import { InviteCode } from "@/components/app/group-settings/invite-code";
import { SettingsSection } from "@/components/app/group-settings/settings-section";

export const metadata: Metadata = {
  title: "Invite code",
};

/** Renders the code that gets somebody into this group, and the way to replace it. */
export default async function GroupInviteCodePage({
  params,
}: PageProps<"/app/groups/[uid]/settings/invite-code">) {
  const { uid } = await params;
  const group = await loadAdminGroup(uid);

  if (!group) return null;

  return (
    <SettingsSection
      title="Invite code"
      description="Anyone holding this can join, and nobody has to approve them."
    >
      {/* An admin with no code is a backend that sent none, not a permission:
          the role has already been checked, so there is nothing to hide. */}
      {group.inviteCode ? (
        <InviteCode groupUid={uid} code={group.inviteCode} />
      ) : (
        <p className="text-body-md text-muted-foreground">
          This group has no invite code right now. Issue one and it will appear here.
        </p>
      )}
    </SettingsSection>
  );
}
