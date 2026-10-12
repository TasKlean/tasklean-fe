/**
 * The chrome every signed-in page shares. Minimal on purpose: the navigation
 * belongs with the screens it links to, which do not exist yet.
 */

import Link from "next/link";
import { logoutAction } from "@/app/(app)/actions";
import { LogoutButton } from "@/components/app/logout-button";
import { BrandMark } from "@/components/common/brand-mark";
import { Greeting } from "@/components/common/greeting";

type AppHeaderProps = {
  name: string | null;
};

/** Renders the signed-in header. */
export function AppHeader({ name }: AppHeaderProps) {
  return (
    <header className="bg-background/85 border-border/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop gap-gutter mx-auto flex h-16 items-center justify-between md:h-20">
        <Link href="/app" className="flex items-center">
          <BrandMark />
        </Link>

        <div className="gap-space-xs flex items-center">
          <Greeting
            name={name}
            className="text-label-lg text-muted-foreground px-space-sm hidden whitespace-nowrap sm:block"
          />

          <form action={logoutAction}>
            <LogoutButton />
          </form>
        </div>
      </div>
    </header>
  );
}
