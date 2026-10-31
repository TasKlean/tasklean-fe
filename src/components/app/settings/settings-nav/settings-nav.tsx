/**
 * The settings rail. A client component only because marking the open section
 * needs the current path; it is hidden below `lg`, where the index page is the
 * navigation instead.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_GROUPS } from "@/app/(app)/app/settings/sections/sections";
import { linkTone } from "@/components/app/settings/settings-nav/link-tone";

const LINK =
  "text-label-lg gap-space-sm px-space-md flex min-h-11 items-center rounded-xl transition-colors";

/** Renders the settings groups and their sections, marking the open one. */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="gap-space-md hidden flex-col lg:flex">
      {SETTINGS_GROUPS.map((group) => (
        <div key={group.label} className="gap-space-xs flex flex-col">
          <h2
            id={`settings-group-${group.label}`}
            className="text-label-sm text-muted-foreground px-space-md uppercase"
          >
            {group.label}
          </h2>

          <ul aria-labelledby={`settings-group-${group.label}`} className="flex flex-col">
            {group.sections.map((section) => {
              const open = pathname === section.href || pathname.startsWith(`${section.href}/`);
              const Icon = section.icon;

              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    aria-current={open ? "page" : undefined}
                    className={`${LINK} ${linkTone(open, section.destructive === true)}`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
