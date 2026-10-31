/**
 * The chrome every signed-in page shares. Its row is as wide as the page under
 * it, which `HeaderBar` decides, so the brand sits at the window's edge above a
 * group's rail and inside the column everywhere else.
 *
 * The group switcher is here because it answers "which group am I in" for every
 * screen inside one; the rest of the navigation belongs with its screens.
 */

import Link from "next/link";
import { AddTaskButton } from "@/components/app/chrome/add-task-button";
import { HeaderBar } from "@/components/app/chrome/app-header/header-bar";
import { GroupSwitcher } from "@/components/app/chrome/group-switcher/group-switcher";
import { AccountMenu } from "@/components/common/account-menu/account-menu";
import { BrandMark } from "@/components/common/brand-mark";
import { Greeting } from "@/components/common/greeting";
import type { MyGroup } from "@/lib/groups/groups.types";

type AppHeaderProps = {
  name: string | null;
  photoUrl: string | null;
  groups: MyGroup[];
};

/** Renders the signed-in header. */
export function AppHeader({ name, photoUrl, groups }: Readonly<AppHeaderProps>) {
  return (
    // The height is here rather than on the row inside, border included, so
    // `--spacing-header` is the header's whole outer height: with the border
    // outside it, the rail below stood 1px taller than its row and every group
    // screen scrolled by that pixel. Measured.
    <header className="bg-background/85 border-border/60 md:h-header sticky top-0 z-50 h-16 w-full border-b backdrop-blur-xl">
      <HeaderBar>
        <div className="gap-space-md flex min-w-0 items-center">
          <Link href="/app" className="flex shrink-0 items-center">
            {/* No wordmark on a phone: the logo, the brand, a group name and an
                avatar do not fit at 360px, and the switcher is what is needed. */}
            <BrandMark wordmark="sm-up" />
          </Link>

          <GroupSwitcher groups={groups} />
        </div>

        <div className="gap-space-xs flex shrink-0 items-center">
          <AddTaskButton />

          <Greeting
            name={name}
            className="text-label-lg text-muted-foreground px-space-sm hidden whitespace-nowrap sm:block"
          />

          <AccountMenu name={name} photoUrl={photoUrl} />
        </div>
      </HeaderBar>
    </header>
  );
}
