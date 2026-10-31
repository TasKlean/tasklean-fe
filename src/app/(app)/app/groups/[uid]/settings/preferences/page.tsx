import type { Metadata } from "next";
import { GroupPreferences } from "@/components/app/group/settings/group-preferences/group-preferences";
import { SettingsSection } from "@/components/app/group/settings/settings-section";

export const metadata: Metadata = {
  title: "Preferences",
};

/** Renders how this group's tasks are laid out for the reader, and nobody else. */
export default function GroupPreferencesPage() {
  return (
    <SettingsSection
      title="Preferences"
      description="How this group's tasks are laid out for you. Nobody else sees this choice."
    >
      <GroupPreferences />
    </SettingsSection>
  );
}
