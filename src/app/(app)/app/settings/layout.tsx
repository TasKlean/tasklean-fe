/**
 * The settings shell. One layout, two behaviours: below `lg` each section is a
 * full page reached from the index, and at `lg` the shell is exactly one
 * viewport tall, so the heading and the rail stay put and only the section
 * scrolls. Sections are real routes either way, so both deep link.
 */

import type { Metadata } from "next";
import { SettingsNav } from "@/components/app/settings/settings-nav/settings-nav";

export const metadata: Metadata = {
  title: "Settings",
};

// `svh` rather than `dvh`: a viewport that grows when the address bar hides
// would leave the shell short of the window it was measured against.
const SHELL =
  "max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl gap-space-lg mx-auto flex flex-col lg:h-[calc(100svh-var(--spacing-header))]";

// `min-h-0` is what lets the columns scroll: a flex item's floor is its own
// content, so without it the shell grows and the whole page scrolls instead.
const COLUMNS = "gap-gutter lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[16rem_minmax(0,1fr)]";

const SECTION = "scrollbar-none min-w-0 lg:overflow-y-auto";

/** Renders the settings chrome around a section. */
export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <div className={SHELL}>
      <h1 className="text-headline-md md:text-headline-lg text-foreground">Settings</h1>

      <div className={COLUMNS}>
        <SettingsNav />
        <div className={SECTION}>{children}</div>
      </div>
    </div>
  );
}
