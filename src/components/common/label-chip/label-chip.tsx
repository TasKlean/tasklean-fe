/**
 * A category or a tag, wearing its own colour. The pill is tinted from the
 * stored hex rather than filled with it, so the text stays the normal
 * foreground and no swatch can end up unreadable in either scheme.
 *
 * The recipe is `label-tint` in `globals.css`; only the value is inline.
 */

import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";

type LabelChipProps = {
  name: string;
  // Absent for a label nobody gave a colour, which the backend allows.
  color?: string | null;
  // A category's icon, which the chip knows nothing about beyond where it goes.
  icon?: ReactNode;
  // Smaller on a board row, where a chip sits beside several others and the
  // chore's own name is what should carry the weight.
  size?: "sm" | "md";
};

// React's own CSSProperties has no room for a custom property, and the stored
// colour is exactly the dynamic value an inline style is for.
type TintStyle = CSSProperties & { "--label-color": string };

// `max-w-full` rather than `shrink-0`: a chip in a wrapping row takes its own
// line before it truncates, and `shrink-0` would cancel the truncation.
const CHIP = "gap-1 label-tint flex max-w-full items-center rounded-full border px-2 py-0.5";

const TEXT = { sm: "text-label-sm", md: "text-label-md" } as const;

/** Renders one label as a tinted pill. */
export function LabelChip({ name, color, icon, size = "md" }: Readonly<LabelChipProps>) {
  const tint: TintStyle = { "--label-color": color ?? DEFAULT_SWATCH };

  return (
    <span className={`${CHIP} ${TEXT[size]}`} style={tint}>
      {icon}
      <span className="truncate">{name}</span>
    </span>
  );
}
