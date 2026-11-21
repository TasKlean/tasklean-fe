/**
 * The icon a category may carry, in the same shape as the colour picker. A
 * category need not have one, so the set is headed by a cell that clears it:
 * the backend reads an omitted icon as none, and `optionalIconRule` turns the
 * blank this posts into an omission.
 */

import { Ban } from "lucide-react";
import { CATEGORY_ICONS } from "@/components/common/category-icon/category-icon";
import { SwatchSelect } from "@/components/common/swatch-select/swatch-select";
import type { SwatchOption } from "@/components/common/swatch-select/swatch-select.types";

type IconPickerProps = {
  // The stored icon's name, or an empty string for a category without one.
  value: string;
  onChange: (icon: string) => void;
};

const GLYPH = "text-foreground size-5";

const NONE = <Ban className="text-muted-foreground size-5" aria-hidden />;

const OPTIONS: readonly SwatchOption[] = [
  { value: "", label: "No icon", content: NONE },
  ...CATEGORY_ICONS.map(({ name, label, Icon }) => ({
    value: name,
    label,
    content: <Icon className={GLYPH} aria-hidden />,
  })),
];

/** Renders the icon set behind a single circle. */
export function IconPicker({ value, onChange }: Readonly<IconPickerProps>) {
  return (
    <SwatchSelect
      name="icon"
      label="Icon"
      value={value}
      options={OPTIONS}
      // A name from outside the set draws the same cell that clears one, since
      // there is nothing of it to show.
      fallback={NONE}
      onChange={onChange}
    />
  );
}
