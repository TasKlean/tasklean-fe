/**
 * The categories a household files its tasks under. Narrowing happens here:
 * nothing in the response is required, so a row without an id or a name has
 * nothing to draw or act on and is left out.
 */

import { CategoryRow } from "@/components/app/group/labels/category-row/category-row";
import { EMPTY_NOTE } from "@/components/app/group/labels/labels.styles";
import type { Category } from "@/lib/labels/categories/categories.types";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import type { CategoryValues } from "@/lib/validation/forms/category.schema/category.schema";

type CategoryListProps = {
  groupUid: string;
  categories: Category[];
  canManage: boolean;
};

type Row = { id: number } & CategoryValues;

/**
 * Keeps the categories there is something to draw.
 *
 * A colourless category is given the palette's first colour, which is also
 * what the next save will store: the chip has to paint something, and a label
 * with no colour at all is not worth a second state.
 */
function rows(categories: Category[]): Row[] {
  const kept: Row[] = [];

  for (const category of categories) {
    if (typeof category.id !== "number" || !category.name) continue;

    kept.push({
      id: category.id,
      name: category.name,
      color: category.color ?? DEFAULT_SWATCH,
      icon: category.icon ?? "",
    });
  }

  return kept;
}

/** Renders a household's categories. */
export function CategoryList({ groupUid, categories, canManage }: Readonly<CategoryListProps>) {
  const kept = rows(categories);

  if (kept.length === 0) {
    return <p className={EMPTY_NOTE}>No categories yet. A task does not have to have one.</p>;
  }

  return (
    <ul className="flex flex-col">
      {kept.map((category) => (
        <CategoryRow
          key={category.id}
          groupUid={groupUid}
          category={category}
          canManage={canManage}
        />
      ))}
    </ul>
  );
}
