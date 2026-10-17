/**
 * The settings groups and their sections, in the order they appear. One list
 * feeds the desktop rail and the mobile index, so the two cannot drift.
 *
 * Account sits last while deactivation is the only thing in it: a destructive
 * link has no business being the first thing settings offers.
 */

import { KeyRound, Link2, MonitorSmartphone, UserX } from "lucide-react";
import type { SettingsGroup } from "@/app/(app)/app/settings/sections.types";

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Security",
    sections: [
      {
        href: "/app/settings/password",
        label: "Password",
        description: "Change it, or set your first one",
        icon: KeyRound,
      },
      {
        href: "/app/settings/connected-accounts",
        label: "Connected accounts",
        description: "The accounts you sign in with",
        icon: Link2,
      },
      {
        href: "/app/settings/devices",
        label: "Devices and sessions",
        description: "Where you are signed in, and how to sign out",
        icon: MonitorSmartphone,
      },
    ],
  },
  {
    label: "Account",
    sections: [
      {
        href: "/app/settings/deactivate",
        label: "Deactivate account",
        description: "Close your account for good",
        icon: UserX,
        destructive: true,
      },
    ],
  },
];
