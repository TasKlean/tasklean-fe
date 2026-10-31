import type { Metadata } from "next";
import { GroupNotifications } from "@/components/app/group/settings/group-notifications/group-notifications";
import { SettingsSection } from "@/components/app/group/settings/settings-section";

export const metadata: Metadata = {
  title: "Notifications",
};

/** Renders which of this group's notifications reach the reader. */
export default function GroupNotificationsPage() {
  return (
    <SettingsSection
      title="Notifications"
      description="Which of this group's notifications reach you."
    >
      <GroupNotifications />
    </SettingsSection>
  );
}
