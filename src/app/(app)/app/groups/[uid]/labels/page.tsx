import type { Metadata } from "next";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { loadLabels } from "@/app/(app)/app/groups/[uid]/labels/page.helpers";
import { AddLabel } from "@/components/app/group/labels/add-label/add-label";
import { CategoryList } from "@/components/app/group/labels/category-list/category-list";
import { LabelSection } from "@/components/app/group/labels/label-section/label-section";
import { ADD_BLOCK } from "@/components/app/group/labels/labels.styles";
import { TagList } from "@/components/app/group/labels/tag-list/tag-list";
import { LoadError } from "@/components/common/load-error";
import { isGroupAdmin } from "@/lib/groups/role/role";

export const metadata: Metadata = {
  title: "Labels",
};

// What each section says the reader may do, which is the whole of the role
// gate a reader sees: a control they will never have is not drawn at all.
const CATEGORY_NOTE = {
  admin: "You can add, rename and remove these.",
  member: "Only an admin can add, rename or remove a category.",
} as const;

const TAG_NOTE = {
  admin: "You can add, rename, recolour and remove these.",
  member: "You can add a tag and change its colour. Renaming or removing one is an admin's.",
} as const;

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
  const role = admin ? "admin" : "member";

  return (
    <div className="gap-space-xl flex flex-col">
      <LabelSection
        title="Categories"
        description="What a task is filed under. A task has one at most, and the list is the household's own filing system."
        note={CATEGORY_NOTE[role]}
      >
        {categories.failure ? (
          <LoadError title="Categories would not load" message={categories.failure} />
        ) : (
          <>
            <CategoryList groupUid={uid} categories={categories.items} canManage={admin} />

            {admin ? (
              <div className={ADD_BLOCK}>
                <AddLabel groupUid={uid} kind="category" />
              </div>
            ) : null}
          </>
        )}
      </LabelSection>

      <LabelSection
        title="Tags"
        description="Loose labels anybody can put on a task. A task carries up to five, and a tag can be taken off whenever."
        note={TAG_NOTE[role]}
      >
        {tags.failure ? (
          <LoadError title="Tags would not load" message={tags.failure} />
        ) : (
          <>
            <TagList groupUid={uid} tags={tags.items} admin={admin} />

            <div className={ADD_BLOCK}>
              <AddLabel groupUid={uid} kind="tag" />
            </div>
          </>
        )}
      </LabelSection>
    </div>
  );
}
