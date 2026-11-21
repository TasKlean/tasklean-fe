/**
 * One choice in a filter panel, as a pill. A real checkbox or radio under the
 * paint, so the browser gives us the grouping, the keyboard and the form value
 * for nothing, and the panel posts without any JavaScript.
 *
 * The input is `sr-only` inside the label and the pill carries the focus ring,
 * which is how every tickbox in the app is built.
 */

import type { ReactNode } from "react";

type FilterChipProps = {
  // The field this choice belongs to, repeated across a group.
  name: string;
  value: string;
  label: string;
  // Checkbox for a field that takes several, radio for one that takes one.
  kind: "checkbox" | "radio";
  defaultChecked: boolean;
  // A swatch or an icon shown before the label.
  mark?: ReactNode;
};

// Denser than the app's 44px floor on purpose: the panel stacks six fields of
// these, and at full height it scrolls before a phone can see the Apply press.
// `relative` is load-bearing: the input is `sr-only`, so absolute, and without
// a containing block here it escapes a scrolling strip and widens the page.
const PILL =
  "text-label-md relative gap-1.5 px-space-sm py-1 border-border/60 text-muted-foreground has-[:checked]:bg-secondary has-[:checked]:text-secondary-foreground has-[:checked]:border-transparent has-[:focus-visible]:ring-ring hover:bg-muted flex min-h-9 shrink-0 cursor-pointer items-center rounded-full border whitespace-nowrap transition-colors select-none has-[:focus-visible]:ring-2";

/** Renders one choice as a pill that ticks. */
export function FilterChip({
  name,
  value,
  label,
  kind,
  defaultChecked,
  mark,
}: Readonly<FilterChipProps>) {
  return (
    <label className={PILL}>
      <input
        type={kind}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {mark}
      <span className="truncate">{label}</span>
    </label>
  );
}
