import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";

type SwatchProps = {
  // The label's own stored hex, which is data rather than a token.
  color?: string;
};

/** Renders a dot in a label's own colour, so a long strip is scannable. */
export function Swatch({ color }: Readonly<SwatchProps>) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: color ?? DEFAULT_SWATCH }}
      className="size-2.5 shrink-0 rounded-full"
    />
  );
}
