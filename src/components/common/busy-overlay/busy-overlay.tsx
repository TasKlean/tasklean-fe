/**
 * The scrim a wait nobody should miss puts over the card it belongs to. It
 * covers the nearest positioned ancestor, so the box it is meant to cover has
 * to say `relative`: the auth card and the connected accounts card both do.
 */

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type BusyOverlayProps = {
  children: ReactNode;
};

/** Renders a spinner and a line over the card, and blocks what is behind it. */
export function BusyOverlay({ children }: Readonly<BusyOverlayProps>) {
  return (
    <div className="bg-card/85 gap-space-sm p-space-lg absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
      <Loader2 className="text-link size-8 motion-safe:animate-spin" aria-hidden />
      <output className="text-body-md text-foreground text-center">{children}</output>
    </div>
  );
}
