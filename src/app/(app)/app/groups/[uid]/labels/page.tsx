import type { Metadata } from "next";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { loadLabels } from "@/app/(app)/app/groups/[uid]/labels/page.helpers";
import { CategoryList } from "@/components/app/group/labels/category-list/category-list";
import { LabelSection } from "@/components/app/group/labels/label-section/label-section";
import { TagList } from "@/components/app/group/labels/tag-list/tag-list";
import { SECTION_COLUMN } from "@/components/app/group/shell/shell.styles";
import { LoadError } from "@/components/common/load-error";
import { isGroupAdmin } from "@/lib/groups/role/role";

export const metadata: Metadata = {
  title: "Labels",
};

// Said to a member only. An admin is drawn every press there is, so a line
// listing them tells that reader nothing they cannot already see.
const CATEGORY_NOTE = "Only an admin can add, rename or remove a category.";

const TAG_NOTE = "You can add a tag and change its colour. Renaming or removing one is an admin's.";

/**
 * Renders a household's categories and tags, in two sections on one screen.
 *
 * The permissions differ per control rather than per section, so both lists are
 * everybody's and the presses are gated one at a time.
 */
export default async function GroupLabelsPage({ params }: PageProps<"/app/groups/[uid]/labels">) {
  const { uid } = await params;
  const { group } = await loadGroup(uid);

  // The shell reports a group it could not load and renders no children, so
  // there is nothing left for this screen to say about one.
  if (!group) return null;

  const admin = isGroupAdmin(group.myRole);
  const { categories, tags } = await loadLabels(uid);

  return (
    <div className={`gap-space-xl flex flex-col ${SECTION_COLUMN}`}>
      <LabelSection
        title="Categories"
        description="Manage your group's categories."
        note={admin ? undefined : CATEGORY_NOTE}
        groupUid={uid}
        kind="category"
        canAdd={admin && !categories.failure}
      >
        {categories.failure ? (
          <LoadError title="Categories would not load" message={categories.failure} />
        ) : (
          <CategoryList groupUid={uid} categories={categories.items} canManage={admin} />
        )}
      </LabelSection>

      <LabelSection
        title="Tags"
        description="Manage your group's tags."
        note={admin ? undefined : TAG_NOTE}
        groupUid={uid}
        kind="tag"
        canAdd={!tags.failure}
      >
        {tags.failure ? (
          <LoadError title="Tags would not load" message={tags.failure} />
        ) : (
          <TagList groupUid={uid} tags={tags.items} admin={admin} />
        )}
      </LabelSection>
    </div>
  );
}
