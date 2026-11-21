/**
 * The colour a label wears: one circle showing what is chosen, opening the
 * palette on a press.
 *
 * Only the palette is offered. The backend takes any `#RRGGBB`, but a colour
 * near black or white comes out as no colour at all once the chip tints it, so
 * one stored from elsewhere is shown and kept rather than offered.
 */

import { SwatchSelect } from "@/components/common/swatch-select/swatch-select";
import type { SwatchOption } from "@/components/common/swatch-select/swatch-select.types";
import { SWATCHES } from "@/lib/labels/palette/palette";

type ColorPickerProps = {
  // The stored colour, which may be one this palette does not hold.
  value: string;
  onChange: (color: string) => void;
};

const DOT = "ring-border size-6 rounded-full ring-1";

/** Draws one colour, in a cell and on the closed trigger alike. */
function dot(color: string) {
  return <span className={DOT} style={{ backgroundColor: color }} />;
}

const OPTIONS: readonly SwatchOption[] = SWATCHES.map((swatch) => ({
  value: swatch.value,
  label: swatch.label,
  content: dot(swatch.value),
}));

/** Renders the palette behind a single swatch. */
export function ColorPicker({ value, onChange }: Readonly<ColorPickerProps>) {
  return (
    <SwatchSelect
      name="color"
      label="Colour"
      value={value.toLowerCase()}
      options={OPTIONS}
      fallback={dot(value)}
      onChange={onChange}
    />
  );
}
