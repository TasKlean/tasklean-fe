/**
 * A label's stored hex on its way into CSS. `label-tint` and `label-pill` in
 * `globals.css` hold the recipe and read `--label-color`, so this is the one
 * inline style the app writes and the fallback is here rather than in each
 * caller.
 */

import type { CSSProperties } from "react";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";

// React's own CSSProperties has no room for a custom property.
type TintStyle = CSSProperties & { "--label-color": string };

/** Hands a label's colour to the stylesheet. */
export function labelTint(color?: string | null): TintStyle {
  return { "--label-color": color ?? DEFAULT_SWATCH };
}
