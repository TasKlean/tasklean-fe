import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { ActivityEmpty } from "@/components/app/group/overview/activity/activity-empty";
import { ActivityFeed } from "@/components/app/group/overview/activity/activity-feed";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroupActivity } from "@/lib/audit/audit";
import type { AuditPage } from "@/lib/audit/audit.types";
import { getSession } from "@/lib/auth/session/session";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";

export const metadata: Metadata = {
  title: "Activity",
};

const EMPTY: AuditPage = { entries: [], nextCursor: null, total: 0 };

/**
 * Renders what has happened in this group, newest first.
 *
 * The backend narrows the rows per caller, so an admin and a member reading
 * this path see different feeds and different counts. Nothing is filtered here.
 */
export default async function ActivityPage({
  params,
}: PageProps<"/app/groups/[uid]/overview/activity">) {
  const { uid } = await params;
  // The shell read this already and `getGroup` is memoised per request, so the
  // role costs nothing here. A group that would not load never gets this far.
  const { group } = await loadGroup(uid);
  const admin = isGroupAdmin(group?.myRole);

  let page = EMPTY;
  let failure: string | null = null;

  try {
    page = await getGroupActivity(uid);
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  const session = await getSession();
  const heading = (
    <div className="gap-space-xs flex min-w-0 flex-col">
      <h2 className="text-headline-sm text-foreground">Activity</h2>
      <p className="text-body-md text-muted-foreground">
        {admin
          ? "Everything that has happened in this group."
          : "What you have done here, and what happened to the things you made."}
      </p>
    </div>
  );

  if (failure || page.entries.length === 0) {
    return (
      <section className="gap-space-md flex flex-col">
        {heading}
        {failure ? (
          <LoadError title="We could not load the activity." message={failure} />
        ) : (
          <ActivityEmpty admin={admin} />
        )}
      </section>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <ActivityFeed
        groupUid={uid}
        first={page}
        viewerUid={session?.userUid ?? null}
        // One instant for every row, so "2 hours ago" cannot disagree between
        // the server's render and the browser's.
        now={new Date()}
        heading={heading}
      />
    </section>
  );
}
