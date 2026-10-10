/**
 * The shell for pages anyone may land on: site header, footer, and the only
 * routes meant to be indexed.
 */

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

/** Renders the public site chrome around a page. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
