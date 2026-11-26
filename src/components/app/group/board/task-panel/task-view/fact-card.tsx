import type { ReactNode } from "react";

type FactCardProps = {
  children: ReactNode;
};

// A bounded card rather than rows on the panel itself, so what the task is
// set to reads as one thing between the picture above it and the tags below.
const CARD = "bg-muted/40 border-border/60 divide-border/60 divide-y rounded-xl border p-1";

/** Renders the card holding what a task is set to. */
export function FactCard({ children }: Readonly<FactCardProps>) {
  return <dl className={CARD}>{children}</dl>;
}
