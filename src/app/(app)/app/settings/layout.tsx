/**
 * The settings shell. One layout, two behaviours: below `lg` each section is a
 * full page reached from the index, and at `lg` the index becomes a rail beside
 * the open section. Sections are real routes either way, so both deep link.
 */

import type { Metadata } from "next";
import { SettingsNav } from "@/components/app/settings-nav/settings-nav";

export const metadata: Metadata = {
  title: "Settings",
};

/** Renders the settings chrome around a section. */
export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl gap-space-lg mx-auto flex flex-col">
      <h1 className="text-headline-md md:text-headline-lg text-foreground">Settings</h1>

      <div className="gap-gutter lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
