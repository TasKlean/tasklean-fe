import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { BackLink } from "@/components/auth/back-link";
import { CopyButton } from "@/components/common/copy-button/copy-button";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroup } from "@/lib/groups/groups";
import type { Group } from "@/lib/groups/groups.types";
import { groupLabel, memberCountLabel } from "@/lib/groups/labels/labels";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";

export const metadata: Metadata = {
  title: "Group",
};

const PAGE =
  "max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl gap-space-lg mx-auto flex flex-col";

/**
 * Renders one group.
 *
 * `new` and `join` are static segments, so Next matches those routes ahead of
 * this one; a uid is a UUID and can never collide with either.
 */
export default async function GroupPage({ params }: PageProps<"/app/groups/[uid]">) {
  const { uid } = await params;

  let group: Group | null = null;
  let failure: string | null = null;

  try {
    group = await getGroup(uid);
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    // A group that is someone else's and a uid that never existed are the same
    // 403, so neither is an error to report: both mean go back to the list.
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  if (!group) {
    return (
      <div className={PAGE}>
        <BackLink href="/app" label="Back to your groups" />
        <LoadError title="We could not load that group." message={failure} />
      </div>
    );
  }

  const admin = isGroupAdmin(group.myRole);
  const members = memberCountLabel(group.memberCount);
  const description = group.description?.trim();

  return (
    <div className={PAGE}>
      <BackLink href="/app" label="Back to your groups" />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-headline-md md:text-headline-lg text-foreground break-words">
          {groupLabel(group.name)}
        </h1>

        {description ? (
          <p className="text-body-md text-muted-foreground max-w-prose">{description}</p>
        ) : null}

        <p className="text-label-md text-muted-foreground gap-space-xs flex flex-wrap items-center">
          <Users className="size-4 shrink-0" aria-hidden />
          {members ? (
            <>
              {members}
              <span aria-hidden>·</span>
            </>
          ) : null}
          {admin ? "You are an admin" : "You are a member"}
        </p>
      </header>

      {/* Gated on the role, never on the field being present: only an admin is
          sent a code at all, so an absent one is a permission, not a gap. */}
      {admin && group.inviteCode ? (
        <section className="bg-card border-border/60 p-space-lg gap-space-sm flex flex-col rounded-xl border">
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
    </div>
  );
}
