/**
 * One choice in a filter panel, as a pill. A real checkbox or radio under the
 * paint, so the browser gives us the grouping, the keyboard and the form value
 * for nothing, and the panel posts without any JavaScript.
 *
 * The input is `sr-only` inside the label and the pill carries the focus ring,
 * which is how every tickbox in the app is built.
 *
 * A choice that is a label wears its own colour rather than the brand fill, so
 * a strip of categories reads as colours before it reads as words.
 */

import type { ReactNode } from "react";
import { labelTint } from "@/components/common/label-tint/label-tint";

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
  // When that mark is drawn. `checked` for a label whose pill already wears
  // its own colour, where a dot on every one of them says nothing.
  markOn?: "always" | "checked";
  // `label` for a category or a tag, which wears its own colour. Said rather
  // than read off `color`, since a label nobody gave one still belongs in the
  // strip beside those that have one.
  tone?: "plain" | "label";
  // The label's own stored hex, where it has one.
  color?: string | null;
  // A tag, which is led by a hash wherever one is drawn. Hidden from the
  // reading, the label being what names the choice.
  hash?: boolean;
};

// Denser than the app's 44px floor on purpose: the panel stacks six fields of
// these, and at full height it scrolls before a phone can see the Apply press.
// `relative` is load-bearing: the input is `sr-only`, so absolute, and without
// a containing block here it escapes a scrolling strip and widens the page.
const PILL =
  "text-label-md relative gap-1.5 px-space-sm py-1 has-[:focus-visible]:ring-ring flex min-h-9 shrink-0 cursor-pointer items-center rounded-full border whitespace-nowrap transition-colors select-none has-[:focus-visible]:ring-2";

// A choice with nothing of its own to wear, where the brand fill is what says
// which one is on.
const PLAIN =
  "border-border/60 text-muted-foreground hover:bg-muted has-[:checked]:bg-secondary has-[:checked]:text-secondary-foreground has-[:checked]:border-transparent";

// `label-pill` deepens its own colour when the input inside it is checked, so
// nothing here says which is on.
const TINTED = "label-pill text-foreground";

/** Renders one choice as a pill that ticks. */
export function FilterChip({
  name,
  value,
  label,
  kind,
  defaultChecked,
  mark,
  markOn = "always",
  tone = "plain",
  color,
  hash = false,
}: Readonly<FilterChipProps>) {
  const asLabel = tone === "label";
  const gated = markOn === "checked";

  return (
    <label
      style={asLabel ? labelTint(color) : undefined}
      className={`${PILL} ${asLabel ? TINTED : PLAIN}`}
    >
      <input
        type={kind}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className={gated ? "peer sr-only" : "sr-only"}
      />
      {/* `flex` rather than `block`: the mark is a sized span, which a block
          wrapper lays out inline and then draws at no size at all. */}
      {gated ? <span className="hidden peer-checked:flex">{mark}</span> : mark}

      {hash ? (
        <span aria-hidden className="text-muted-foreground shrink-0">
          #
        </span>
      ) : null}

      <span className="truncate">{label}</span>
    </label>
  );
}
