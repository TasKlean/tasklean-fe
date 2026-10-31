import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
};

/** Separates a step from the method's own description above it. */
export function Panel({ children }: Readonly<PanelProps>) {
  return (
    <div className="border-border/60 pt-space-md gap-space-md flex flex-col border-t">
      {children}
    </div>
  );
}
