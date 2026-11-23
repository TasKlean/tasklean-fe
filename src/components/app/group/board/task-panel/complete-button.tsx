/**
 * Finishing a chore, which the backend has no endpoint for yet. A disabled
 * button rather than nothing, because the press is what this panel is for, and
 * the reason rides in its name where there is no room to put it beside.
 */

import { CircleCheck } from "lucide-react";

type CompleteButtonProps = {
  // The header's is a pill beside other controls; the footer's is the press
  // the panel exists for and takes the width.
  size: "sm" | "lg";
};

// Keeps its brand colour while disabled, as the add-task press does: a greyed
// primary action reads as a bug rather than as something not built yet.
const SHELL =
  "bg-primary text-primary-foreground gap-space-xs flex items-center justify-center rounded-full font-semibold disabled:cursor-not-allowed disabled:opacity-70";

const SIZES = {
  sm: "text-label-md min-h-9 px-space-sm",
  lg: "text-label-lg min-h-11 w-full px-space-md",
} as const;

/** Renders the Complete press, disabled until there is something behind it. */
export function CompleteButton({ size }: Readonly<CompleteButtonProps>) {
  return (
    <button type="button" disabled className={`${SHELL} ${SIZES[size]}`}>
      <CircleCheck className="size-4 shrink-0" aria-hidden />
      Complete (coming soon)
    </button>
  );
}
