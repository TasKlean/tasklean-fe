/**
 * The shell for everything behind the session. Proxy has already established
 * that there is one, so nothing here re-checks. Typed against `/` because a
 * route group adds no path segment, the same as the public shell.
 */

import { AppHeader } from "@/components/app/app-header/app-header";
import { getSession } from "@/lib/auth/session/session";
import { getMyGroups } from "@/lib/groups/groups";
import type { MyGroup } from "@/lib/groups/groups.types";

/**
 * Reads the caller's groups for the switcher, best effort.
 *
 * @returns The groups, or none at all: the switcher is chrome, so a failed read
 * costs it rather than costing the page the reader asked for.
 */
async function groupsForSwitcher(): Promise<MyGroup[]> {
  try {
    return await getMyGroups();
  } catch {
    return [];
  }
}

/** Renders the signed-in chrome around a page. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const groups = session ? await groupsForSwitcher() : [];

  return (
    // A grid, not a flex column: under a flex column a page that centres itself
    // with `mx-auto` shrinks to its own text. `grid-cols-1` is load-bearing: an
    // implicit column takes the width of the widest thing on the page.
    <div className="bg-background grid min-h-svh grid-cols-1 grid-rows-[auto_minmax(0,1fr)]">
      <AppHeader
        name={session?.name ?? null}
        photoUrl={session?.photoUrl ?? null}
        groups={groups}
      />
      <main>{children}</main>
    </div>
  );
}
