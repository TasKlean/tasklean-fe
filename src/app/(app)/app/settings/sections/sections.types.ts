/**
 * The shape of the settings navigation: sections, and the groups they sit in.
 */

import type { LucideIcon } from "lucide-react";

export type SettingsSection = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  // Marks a section that ends something, so the nav can say so quietly.
  destructive?: boolean;
};

export type SettingsGroup = {
  label: string;
  sections: SettingsSection[];
};
