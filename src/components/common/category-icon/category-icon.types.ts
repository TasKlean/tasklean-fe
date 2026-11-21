import type { LucideIcon } from "lucide-react";

export type CategoryIconChoice = {
  // What is stored on the category and sent back, in lucide's own naming, so
  // the set can grow without a lookup table of our own invention.
  name: string;
  // The choice's only name in the picker, where a glyph says nothing.
  label: string;
  Icon: LucideIcon;
};

export type CategoryIconProps = {
  // Absent for a category nobody gave an icon, and possibly a name from
  // outside the set below, which draws nothing rather than guessing.
  name?: string | null;
  className?: string;
};
