/**
 * One section of a group's settings: the page's own heading, and the card its
 * controls sit in. Every section is a route of its own, so the heading belongs
 * to the page rather than to the card, the same way the account's settings read.
 */

import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description: string;
  // Red where the section's own control ends something, which is the only
  // difference between deleting a group and the rest.
  tone?: "default" | "destructive";
  children: ReactNode;
};

const CARD = "p-space-lg gap-space-md bg-card flex flex-col rounded-xl border";

const TONES = {
  default: "border-border/60",
  destructive: "border-destructive/40",
} as const;

/** Renders a titled section of a group's settings. */
export function SettingsSection({
  title,
  description,
  tone = "default",
  children,
}: Readonly<SettingsSectionProps>) {
  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <h2
          className={`text-headline-sm ${tone === "destructive" ? "text-destructive" : "text-foreground"}`}
        >
          {title}
        </h2>
        <p className="text-body-md text-muted-foreground max-w-prose">{description}</p>
      </div>

      <div className={`${CARD} ${TONES[tone]}`}>{children}</div>
    </section>
  );
}
