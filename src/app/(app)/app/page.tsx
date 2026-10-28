import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AddGroup } from "@/components/app/add-group/add-group";
import { GroupSection } from "@/components/app/group-section/group-section";
import { NoGroups } from "@/components/app/no-groups/no-groups";
import { FormNotice } from "@/components/common/form-notice";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getMyGroups } from "@/lib/groups/groups";
import type { MyGroup } from "@/lib/groups/groups.types";
import { isGroupAdmin } from "@/lib/groups/role/role";

export const metadata: Metadata = {
  title: "Your groups",
};

/** Renders the signed-in landing page: every group the caller is in. */
export default async function AppHomePage({ searchParams }: PageProps<"/app">) {
  const { unavailable } = await searchParams;

  let groups: MyGroup[] = [];
  let failure: string | null = null;

  try {
    groups = await getMyGroups();
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  let body: ReactNode;
  if (failure) {
    body = <LoadError title="We could not load your groups." message={failure} />;
  } else if (groups.length === 0) {
    body = <NoGroups />;
  } else {
    body = (
      <>
        <AddGroup layout="inline" />

        <GroupSection
          title="Groups you manage"
          groups={groups.filter((group) => isGroupAdmin(group.myRole))}
        />
        <GroupSection
          title="Groups you're in"
          groups={groups.filter((group) => !isGroupAdmin(group.myRole))}
        />
      </>
    );
  }

  return (
    <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl gap-space-lg mx-auto flex flex-col">
      <header className="gap-space-xs flex flex-col">
        <h1 className="text-headline-md md:text-headline-lg text-foreground">Your groups</h1>
        <p className="text-body-md text-muted-foreground">
          A group is a household you share chores with. You can be in more than one.
        </p>
      </header>

      {/* The bounce a group route makes when the backend will not show it. It
          cannot say whether the group is someone else's or never existed. */}
      {unavailable === "1" ? (
        <FormNotice tone="info">
          That group is not available to you. It may have been deleted, or you may have left it.
        </FormNotice>
      ) : null}

      {body}
    </div>
  );
}
