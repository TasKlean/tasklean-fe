import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SETTINGS_SECTIONS } from "@/app/(app)/app/settings/sections";

/**
 * Renders the settings index: the section list on a phone, and a prompt on a
 * desktop, where the rail beside it is already showing the same list.
 */
export default function SettingsPage() {
  return (
    <>
      <ul className="gap-space-xs flex flex-col lg:hidden">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className="bg-card border-border/60 hover:bg-muted p-space-md gap-space-md flex min-h-11 items-center rounded-xl border transition-colors"
              >
                <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden />

                <span className="flex min-w-0 flex-col">
                  <span className="text-label-lg text-foreground">{section.label}</span>
                  <span className="text-label-sm text-muted-foreground">{section.description}</span>
                </span>

                <ChevronRight
                  className="text-muted-foreground ml-auto size-5 shrink-0"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-body-md text-muted-foreground bg-card border-border/60 p-space-xl hidden rounded-xl border text-center lg:block">
        Choose a section to get started.
      </p>
    </>
  );
}
