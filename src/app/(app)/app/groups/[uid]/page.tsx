import type { Metadata } from "next";
import { CircleCheckBig } from "lucide-react";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { getGroup } from "@/lib/groups/groups";
import { groupLabel } from "@/lib/groups/labels/labels";

const CARD =
  "bg-card border-border/60 p-space-xl gap-space-md flex flex-col items-start rounded-xl border";

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
 * Renders a group's tasks, which is what opening a group shows.
 *
 * `new` and `join` are static segments, so Next matches those routes ahead of
 * this one; a uid is a UUID and can never collide with either.
 */
export default async function GroupTasksPage({ params }: PageProps<"/app/groups/[uid]">) {
  const { uid } = await params;
  const { group } = await loadGroup(uid);

  // The shell reports a group it could not load and renders no children, so
  // there is nothing left for this screen to say about one.
  if (!group) return null;

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <h2 className="text-headline-sm text-foreground">Tasks</h2>
        <p className="text-body-md text-muted-foreground">
          The chores this group shares, and who is doing them.
        </p>
      </div>

      <div className={CARD}>
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <CircleCheckBig className="size-6" aria-hidden />
        </span>

        <div className="gap-space-xs flex flex-col">
          <h3 className="text-title-md text-foreground">Tasks are being built</h3>
          <p className="text-body-md text-muted-foreground max-w-prose">
            Soon you will add a chore here, give it to somebody, set how often it comes back and
            tick it off when it is done. The group itself is ready, so bring everybody in with the
            invite code while you wait.
          </p>
        </div>
      </div>
    </section>
  );
}
