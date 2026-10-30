import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { LeaveGroup } from "@/components/app/leave-group/leave-group";
import { MemberRow } from "@/components/app/member-row/member-row";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getSession } from "@/lib/auth/session/session";
import type { GroupMember } from "@/lib/groups/groups.types";
import { joinedLabel, memberName, roleLabel } from "@/lib/groups/labels/labels";
import { listGroupMembers } from "@/lib/groups/members/members";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";

export const metadata: Metadata = {
  title: "Members",
};

/** Renders a group's roster, and what the reader may do to it. */
export default async function MembersPage({
  params,
}: PageProps<"/app/groups/[uid]/overview/members">) {
  const { uid } = await params;
  // The shell read this already and `getGroup` is memoised per request, so the
  // role costs nothing here. A group that would not load never gets this far.
  const { group } = await loadGroup(uid);
  const admin = isGroupAdmin(group?.myRole);

  let members: GroupMember[] = [];
  let failure: string | null = null;

  try {
    members = await listGroupMembers(uid);
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  const session = await getSession();
  const mine = members.find((member) => member.user?.uid && member.user.uid === session?.userUid);

  let body: ReactNode;
  if (failure) {
    body = <LoadError title="We could not load the members." message={failure} />;
  } else if (members.length === 0) {
    body = (
      <p className="text-body-md text-muted-foreground bg-card border-border/60 p-space-lg rounded-xl border">
        Nobody is in this group yet. Share the invite code and they will appear here.
      </p>
    );
  } else {
    body = (
      <ul className="gap-space-sm flex flex-col">
        {members.map((member) => {
          const you = member === mine;

          return (
            <MemberRow
              key={member.uid ?? member.user?.uid ?? memberName(member.user)}
              groupUid={uid}
              memberUid={member.uid ?? null}
              name={memberName(member.user)}
              firstName={member.user?.name ?? null}
              lastName={member.user?.lastName ?? null}
              photoUrl={member.user?.photoUrl ?? null}
              role={roleLabel(member.role)}
              admin={isGroupAdmin(member.role)}
              joined={joinedLabel(member.dateJoined)}
              you={you}
              // Your own membership is left to the band below: an admin who
              // removed themselves would be leaving, by another name.
              manageable={admin && !you}
            />
          );
        })}
      </ul>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <h2 className="text-headline-sm text-foreground">Members</h2>
        <p className="text-body-md text-muted-foreground">
          {admin
            ? "Everyone in this group. You can change what they may do, or take them out."
            : "Everyone in this group."}
        </p>
      </div>

      {body}

      {mine?.uid ? <LeaveGroup groupUid={uid} memberUid={mine.uid} admin={admin} /> : null}
    </section>
  );
}
