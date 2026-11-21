/**
 * The tags a household labels its tasks with. Narrowed the same way as the
 * categories: nothing in the response is required, so a row with no id or no
 * name is left out.
 */

import { EMPTY_NOTE } from "@/components/app/group/labels/labels.styles";
import { TagRow } from "@/components/app/group/labels/tag-row/tag-row";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import type { Tag } from "@/lib/labels/tags/tags.types";
import type { TagValues } from "@/lib/validation/forms/tag.schema/tag.schema";

type TagListProps = {
  groupUid: string;
  tags: Tag[];
  admin: boolean;
};

type Row = { id: number } & TagValues;

/** Keeps the tags there is something to draw, colouring the ones nobody did. */
function rows(tags: Tag[]): Row[] {
  const kept: Row[] = [];

  for (const tag of tags) {
    if (typeof tag.id !== "number" || !tag.name) continue;

    kept.push({ id: tag.id, name: tag.name, color: tag.color ?? DEFAULT_SWATCH });
  }

  return kept;
}

/** Renders a household's tags. */
export function TagList({ groupUid, tags, admin }: Readonly<TagListProps>) {
  const kept = rows(tags);

  if (kept.length === 0) {
    return (
      <p className={EMPTY_NOTE}>No tags yet. Anyone can add one, and a task may carry five.</p>
    );
  }

  return (
    <ul className="flex flex-col">
      {kept.map((tag) => (
        <TagRow key={tag.id} groupUid={groupUid} tag={tag} admin={admin} />
      ))}
    </ul>
  );
}
