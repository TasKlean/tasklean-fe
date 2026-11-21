/**
 * The icons a category may be given, and the one that draws a stored name.
 *
 * One ordered list, with the lookup derived from it: two structures would let
 * the picker offer an icon the chip cannot draw. A name outside the set draws
 * nothing, so a value another client stored costs the icon and not the row.
 */

import { createElement } from "react";
import {
  Bath,
  BedDouble,
  Car,
  CookingPot,
  PaintRoller,
  PawPrint,
  Recycle,
  Shirt,
  ShoppingCart,
  Sofa,
  Sprout,
  SprayCan,
  Trash2,
  UtensilsCrossed,
  WashingMachine,
  Wrench,
} from "lucide-react";
import type {
  CategoryIconChoice,
  CategoryIconProps,
} from "@/components/common/category-icon/category-icon.types";

/** The whole set, in the order the picker lays them out. */
export const CATEGORY_ICONS: readonly CategoryIconChoice[] = [
  { name: "utensils-crossed", label: "Kitchen", Icon: UtensilsCrossed },
  { name: "cooking-pot", label: "Cooking", Icon: CookingPot },
  { name: "bath", label: "Bathroom", Icon: Bath },
  { name: "washing-machine", label: "Laundry", Icon: WashingMachine },
  { name: "shirt", label: "Clothes", Icon: Shirt },
  { name: "bed-double", label: "Bedroom", Icon: BedDouble },
  { name: "sofa", label: "Living room", Icon: Sofa },
  { name: "spray-can", label: "Cleaning", Icon: SprayCan },
  { name: "trash-2", label: "Bins", Icon: Trash2 },
  { name: "recycle", label: "Recycling", Icon: Recycle },
  { name: "sprout", label: "Garden", Icon: Sprout },
  { name: "paw-print", label: "Pets", Icon: PawPrint },
  { name: "shopping-cart", label: "Shopping", Icon: ShoppingCart },
  { name: "car", label: "Car", Icon: Car },
  { name: "wrench", label: "Repairs", Icon: Wrench },
  { name: "paint-roller", label: "Decorating", Icon: PaintRoller },
];

const BY_NAME = new Map(CATEGORY_ICONS.map((choice) => [choice.name, choice.Icon]));

/**
 * Names a stored icon, for a control that has to say which one is picked.
 *
 * @returns The choice's label, or null for nothing stored and for a name this
 * set does not hold.
 */
export function categoryIconLabel(name?: string | null): string | null {
  return CATEGORY_ICONS.find((choice) => choice.name === name)?.label ?? null;
}

/** Draws a category's icon, or nothing at all. */
export function CategoryIcon({ name, className = "size-3.5" }: Readonly<CategoryIconProps>) {
  const icon = name ? BY_NAME.get(name) : undefined;
  if (!icon) return null;

  // Built rather than written as JSX: the icon comes out of the set above, and
  // a dynamic element type reads to the linter as a component defined in render.
  return createElement(icon, { className, "aria-hidden": true });
}
