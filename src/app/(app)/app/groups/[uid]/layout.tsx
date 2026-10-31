/**
 * The shell for one group. The rail owns the group's identity, so every screen
 * inside it is only its own section, and it runs down the left edge of the
 * window rather than inside the page's own column. A group that will not load
 * is reported here, children and all.
 */

import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { GroupBar } from "@/components/app/group-bar/group-bar";
import { GroupSidebar } from "@/components/app/group-sidebar/group-sidebar";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import { groupLabel } from "@/lib/groups/labels/labels";
import { isGroupAdmin } from "@/lib/groups/role/role";

const COLUMN =
  "max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop gap-space-lg mx-auto flex flex-col";

const PAGE = `${COLUMN} py-space-xl`;

// The strip sits right above the section on a phone and the pill floats over
// the end of it, so neither the usual top margin nor the usual bottom one fits.
const SECTION = `${COLUMN} pt-space-lg pb-space-3xl lg:py-space-xl`;

/** Renders a group's chrome around one of its sections. */
export default async function GroupLayout({ children, params }: LayoutProps<"/app/groups/[uid]">) {
  const { uid } = await params;
  const { group, failure } = await loadGroup(uid);

  if (!group) {
    return (
      <div className={PAGE}>
        <BackLink href="/app" label="Back to your groups" />
        <LoadError title="We could not load that group." message={failure} />
      </div>
    );
  }

  const admin = isGroupAdmin(group.myRole);

  return (
    // `items-start` rather than `items-stretch`: the rail sticks to the viewport
    // at `lg`, and a stretched flex item would be as tall as the page instead.
    <div className="flex flex-col lg:min-h-full lg:flex-row lg:items-start">
      <GroupSidebar
        uid={uid}
        name={groupLabel(group.name)}
        photoUrl={group.photoUrl ?? null}
        description={group.description?.trim() || null}
        memberCount={group.memberCount ?? null}
        admin={admin}
      />

      <div className="min-w-0 lg:flex-1">
        <div className={SECTION}>{children}</div>
      </div>

      {/* Gated on the role the same way the overview's card is: only an admin
          is sent a code, so an absent one is a permission and not a gap. */}
      <GroupBar uid={uid} admin={admin} inviteCode={admin ? (group.inviteCode ?? null) : null} />
    </div>
  );
}
