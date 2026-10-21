/**
 * The settings groups and their sections, in the order they appear. One list
 * feeds the desktop rail and the mobile index, so the two cannot drift.
 *
 * Preferences sits first because it is the harmless group people come back to,
 * and Account sits last while deactivation is the only thing in it: a
 * destructive link has no business being the first thing settings offers.
 */

import {
  Bell,
  KeyRound,
  Languages,
  Link2,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  UserX,
} from "lucide-react";
import type { SettingsGroup } from "@/app/(app)/app/settings/sections/sections.types";

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Preferences",
    sections: [
      {
        href: "/app/settings/appearance",
        label: "Appearance",
        description: "Light, dark, or whatever your device uses",
        icon: Palette,
      },
      {
        href: "/app/settings/language",
        label: "Language",
        description: "The language the app speaks",
        icon: Languages,
      },
      {
        href: "/app/settings/notifications",
        label: "Notifications",
        description: "Which ones reach you, and where",
        icon: Bell,
      },
    ],
  },
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
        href: "/app/settings/two-factor",
        label: "Two-factor authentication",
        description: "A code from your phone at sign-in",
        icon: ShieldCheck,
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
