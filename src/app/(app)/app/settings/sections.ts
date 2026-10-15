/**
 * The settings sections, in the order they appear. One list feeds the desktop
 * rail and the mobile index, so the two cannot drift as sections are added.
 */

import { MonitorSmartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SettingsSection = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    href: "/app/settings/devices",
    label: "Devices and sessions",
    description: "Where you are signed in, and how to sign out",
    icon: MonitorSmartphone,
  },
];
