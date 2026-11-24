/**
 * One section of a group's settings: the page's own heading, and the card its
 * controls sit in. Every section is a route of its own, so the heading belongs
 * to the page rather than to the card, the same way the account's settings read.
 */

import type { ReactNode } from "react";
import { SECTION_COLUMN } from "@/components/app/group/shell/shell.styles";
import { InfoTip } from "@/components/common/info-tip/info-tip";

type SettingsSectionProps = {
  title: string;
  // What the section is for, which the (i) beside its name holds.
  info: string;
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
  info,
  tone = "default",
  children,
}: Readonly<SettingsSectionProps>) {
  return (
    <section className={`gap-space-md flex flex-col ${SECTION_COLUMN}`}>
      <div className="relative flex items-center gap-1">
        <h2
          className={`text-headline-sm ${tone === "destructive" ? "text-destructive" : "text-foreground"}`}
        >
          {title}
        </h2>

        <InfoTip label={title} text={info} place="right" />
      </div>

      <div className={`${CARD} ${TONES[tone]}`}>{children}</div>
    </section>
  );
}
