import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { ActivityEmpty } from "@/components/app/group/overview/activity/activity-empty";
import { ActivityRow } from "@/components/app/group/overview/activity/activity-row";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroupActivity } from "@/lib/audit/audit";
import type { AuditPage } from "@/lib/audit/audit.types";
import { entryCountLabel } from "@/lib/audit/labels/labels";
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
  const count = failure ? null : entryCountLabel(page.total);

  let body: ReactNode;
  if (failure) {
    body = <LoadError title="We could not load the activity." message={failure} />;
  } else if (page.entries.length === 0) {
    body = <ActivityEmpty admin={admin} />;
  } else {
    body = (
      <ol className="gap-space-sm flex flex-col">
        {page.entries.map((entry, index) => (
          // The backend mints a uid for every entry; an index stands in safely
          // where one is missing, because the feed only ever grows at its end.
          <ActivityRow
            key={entry.uid ?? index}
            entry={entry}
            viewerUid={session?.userUid ?? null}
          />
        ))}
      </ol>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-md flex flex-wrap items-start justify-between">
        <div className="gap-space-xs flex min-w-0 flex-col">
          <h2 className="text-headline-sm text-foreground">Activity</h2>
          <p className="text-body-md text-muted-foreground">
            {admin
              ? "Everything that has happened in this group."
              : "What you have done here, and what happened to the things you made."}
          </p>
        </div>

        {count ? <p className="text-label-sm text-muted-foreground shrink-0">{count}</p> : null}
      </div>

      {body}
    </section>
  );
}
