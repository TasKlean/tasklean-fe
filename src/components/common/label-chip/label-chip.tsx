/**
 * A category or a tag, wearing its own colour. The pill is tinted from the
 * stored hex rather than filled with it, so the text stays the normal
 * foreground and no swatch can end up unreadable in either scheme.
 *
 * The recipe is `label-tint` in `globals.css`; only the value is inline.
 */

import type { ReactNode } from "react";
import { labelTint } from "@/components/common/label-tint/label-tint";

type LabelChipProps = {
  name: string;
  // Absent for a label nobody gave a colour, which the backend allows.
  color?: string | null;
  // A category's icon, which the chip knows nothing about beyond where it goes.
  icon?: ReactNode;
  // A control at the chip's end, such as the way to take a tag off a chore.
  trailing?: ReactNode;
  // Smaller on a board row, where a chip sits beside several others and the
  // chore's own name is what should carry the weight.
  size?: "sm" | "md";
};

// `max-w-full` rather than `shrink-0`: a chip in a wrapping row takes its own
// line before it truncates, and `shrink-0` would cancel the truncation.
const CHIP = "gap-1 label-tint flex max-w-full items-center rounded-full border px-2 py-0.5";

const TEXT = { sm: "text-label-sm", md: "text-label-md" } as const;

/** Renders one label as a tinted pill. */
export function LabelChip({ name, color, icon, trailing, size = "md" }: Readonly<LabelChipProps>) {
  return (
    <span className={`${CHIP} ${TEXT[size]}`} style={labelTint(color)}>
      {icon}
      <span className="truncate">{name}</span>
      {trailing}
    </span>
  );
}
