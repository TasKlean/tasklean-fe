import type { ReactNode } from "react";

// How the leading control works. An href for a panel the URL holds, so the
// press is a real link and works with no JavaScript; a press for one that is
// only state. `back` is about where the control leads rather than what it is:
// an arrow where it leads back into the panel, a cross where it leads out.
export type SidePanelClose =
  { href: string; back?: boolean } | { press: () => void; back?: boolean };

export type SidePanelProps = {
  // Names the panel, so what opened is announced rather than just "dialog".
  label: string;
  close: SidePanelClose;
  // Closes on Escape and on a press anywhere outside the panel. Left out by a
  // panel holding unsaved work, which has its own two ways out: either dismissal
  // would throw away a half-typed task without asking.
  dismissable?: boolean;
  // What the top bar carries beside the way out.
  header: ReactNode;
  children: ReactNode;
};
