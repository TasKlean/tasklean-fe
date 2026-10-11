/**
 * The shell for everything behind the session. Proxy has already established
 * that there is one, so nothing here re-checks. Typed against `/` because a
 * route group adds no path segment, the same as the public shell.
 */

import { AppHeader } from "@/components/app/app-header";
import { getSession } from "@/lib/auth/session";

/** Renders the signed-in chrome around a page. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <AppHeader name={session?.name ?? null} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
