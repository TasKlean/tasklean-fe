import type { Metadata } from "next";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { CopyButton } from "@/components/common/copy-button/copy-button";
import { getGroup } from "@/lib/groups/groups";
import { groupLabel } from "@/lib/groups/labels/labels";
import { isGroupAdmin } from "@/lib/groups/role/role";

const CARD = "bg-card border-border/60 p-space-lg gap-space-sm flex flex-col rounded-xl border";

/**
 * Titles the tab with the group's own name.
 *
 * @returns The name, or the generic title: a failure here must not take the
 * page, which reports the same load through the shell.
 */
export async function generateMetadata({
  params,
}: PageProps<"/app/groups/[uid]">): Promise<Metadata> {
  const { uid } = await params;

  try {
    const group = await getGroup(uid);
    return { title: groupLabel(group.name) };
  } catch {
    return { title: "Group" };
  }
}

/**
 * Renders a group's overview.
 *
 * `new` and `join` are static segments, so Next matches those routes ahead of
 * this one; a uid is a UUID and can never collide with either.
 */
export default async function GroupPage({ params }: PageProps<"/app/groups/[uid]">) {
  const { uid } = await params;
  const { group } = await loadGroup(uid);

  // The shell reports a group it could not load and renders no children, so
  // there is nothing left for this screen to say about one.
  if (!group) return null;

  const admin = isGroupAdmin(group.myRole);

  return (
    <div className="gap-space-lg flex flex-col">
      {/* Gated on the role, never on the field being present: only an admin is
          sent a code at all, so an absent one is a permission, not a gap. */}
      {admin && group.inviteCode ? (
        <section className={CARD}>
          <h2 className="text-label-lg text-foreground">Invite code</h2>
          <p className="text-body-md text-muted-foreground max-w-prose">
            Send this to the people you live with. Anyone holding it can join, and nobody has to
            approve them.
          </p>

          <div className="gap-space-sm flex flex-wrap items-center">
            <code className="bg-muted text-foreground text-title-md px-space-md rounded-md py-2 tracking-widest">
              {group.inviteCode}
            </code>
            <CopyButton value={group.inviteCode} label="Copy code" />
          </div>
        </section>
      ) : null}

      <section className={CARD}>
        <h2 className="text-label-lg text-foreground">What is coming</h2>
        <p className="text-body-md text-muted-foreground max-w-prose">
          Tasks, the member list and this group&apos;s settings are being built. The group itself is
          ready, so anyone holding the invite code can join it already.
        </p>
      </section>
    </div>
  );
}
