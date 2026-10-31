import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AddGroupBar } from "@/components/app/add-group-bar/add-group-bar";
import { AddGroup } from "@/components/app/add-group/add-group";
import { GroupFilters } from "@/components/app/group-filters/group-filters";
import { NoMatches } from "@/components/app/group-filters/no-matches";
import { GroupSection } from "@/components/app/group-section/group-section";
import { NoGroups } from "@/components/app/no-groups/no-groups";
import { FormNotice } from "@/components/common/form-notice";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { filterGroups, groupQuery } from "@/lib/groups/filter/filter";
import { getMyGroups } from "@/lib/groups/groups";
import type { MyGroup } from "@/lib/groups/groups.types";
import { isGroupAdmin } from "@/lib/groups/role/role";

export const metadata: Metadata = {
  title: "Your groups",
};

/** Renders the signed-in landing page: every group the caller is in. */
export default async function AppHomePage({ searchParams }: PageProps<"/app">) {
  const params = await searchParams;
  const { unavailable, left } = params;
  // The URL is the filter, so the page reads it rather than holding any of it.
  const query = groupQuery(params);

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
    // The one call a backend filter replaces: the same query, answered by a
    // `GET` instead of by the list we are already holding.
    const shown = filterGroups(groups, query);

    body = (
      <>
        <GroupFilters query={query} />

        {shown.length === 0 ? <NoMatches /> : null}

        <GroupSection
          title="Groups you manage"
          groups={shown.filter((group) => isGroupAdmin(group.myRole))}
        />
        <GroupSection
          title="Groups you're in"
          groups={shown.filter((group) => !isGroupAdmin(group.myRole))}
        />
      </>
    );
  }

  return (
    <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop pt-space-xl pb-space-3xl lg:py-space-xl gap-space-lg mx-auto flex flex-col">
      <header className="gap-space-md flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="gap-space-xs flex flex-col">
          <h1 className="text-headline-md md:text-headline-lg text-foreground">Your groups</h1>
          <p className="text-body-md text-muted-foreground">
            Choose a group, join one or create your own!
          </p>
        </div>

        {/* Beside the title rather than over the list: the two ways in belong
            to the page, and the row under it belongs to the list. */}
        <AddGroup layout="inline" />
      </header>

      {/* The bounce a group route makes when the backend will not show it. It
          cannot say whether the group is someone else's or never existed. */}
      {unavailable === "1" ? (
        <FormNotice tone="info">
          That group is not available to you. It may have been deleted, or you may have left it.
        </FormNotice>
      ) : null}

      {left === "1" ? (
        <FormNotice tone="success">
          You have left that group. Anyone with its invite code can let you back in.
        </FormNotice>
      ) : null}

      {body}

      <AddGroupBar />
    </div>
  );
}
