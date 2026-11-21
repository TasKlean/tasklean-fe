/**
 * One of the two sections the labels screen holds: its heading, what the labels
 * are for, who may change them, and the card the list sits in.
 *
 * The role note is part of the heading rather than a notice beside a disabled
 * button, because a permission is not a feature that is coming: a control the
 * reader does not have is simply not drawn.
 */

import type { ReactNode } from "react";

type LabelSectionProps = {
  title: string;
  description: string;
  // What the reader may do here, which differs per section and per role.
  note: string;
  children: ReactNode;
};

const CARD = "p-space-lg gap-space-md bg-card border-border/60 flex flex-col rounded-xl border";

/** Renders a titled section of the labels screen. */
export function LabelSection({ title, description, note, children }: Readonly<LabelSectionProps>) {
  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <h2 className="text-headline-sm text-foreground">{title}</h2>
        <p className="text-body-md text-muted-foreground max-w-prose">{description}</p>
        <p className="text-label-md text-muted-foreground max-w-prose">{note}</p>
      </div>

      <div className={CARD}>{children}</div>
    </section>
  );
}
