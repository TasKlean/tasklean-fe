/**
 * What goes before a label's name on a pill: a category's icon where it has
 * one, and a dot in its own colour otherwise, which covers every tag and a
 * category carrying an icon the set does not hold.
 */

import { Swatch } from "@/components/common/swatch/swatch";
import { CategoryIcon, categoryIconLabel } from "@/components/common/category-icon/category-icon";

type LabelMarkProps = {
  // The label's own stored hex, which the dot is drawn in.
  color?: string;
  // A name from the category icon set. Absent for a tag.
  icon?: string;
};

/** Draws a label's icon, or the dot that stands in for one. */
export function LabelMark({ color, icon }: Readonly<LabelMarkProps>) {
  // The label rather than the component: `CategoryIcon` draws nothing for a
  // name the set does not hold, which would leave the pill with no mark at all.
  return categoryIconLabel(icon) ? <CategoryIcon name={icon} /> : <Swatch color={color} />;
}
