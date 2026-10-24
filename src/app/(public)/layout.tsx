/**
 * The shell for pages anyone may land on: site header, footer, and the only
 * routes meant to be indexed. Reading the session here is what makes `/`
 * dynamic, and is the price of chrome that knows whether you are signed in.
 */

import { SiteFooter } from "@/components/marketing/site-footer/site-footer";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { getSession } from "@/lib/auth/session/session";

/** Renders the public site chrome around a page. */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const name = session?.name ?? null;

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader signedIn={session !== null} name={name} photoUrl={session?.photoUrl ?? null} />
      <main className="flex-1">{children}</main>
      <SiteFooter signedIn={session !== null} name={name} />
    </div>
  );
}
