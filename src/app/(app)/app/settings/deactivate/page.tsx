import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { DeactivateAccount } from "@/components/app/deactivate-account/deactivate-account";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import type { ConnectedAccounts } from "@/lib/account/account.types";
import { getConnectedAccounts } from "@/lib/account/account";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";

export const metadata: Metadata = {
  title: "Deactivate account",
};

/** Renders the deactivation section: closing the account, and nothing else. */
export default async function DangerZonePage() {
  let connectedAccounts: ConnectedAccounts | null = null;
  let failure: string | null = null;

  try {
    connectedAccounts = await getConnectedAccounts();
  } catch (error) {
    // A render cannot clear the cookie, so hand it back to Proxy via /login.
    if (isSessionExpiredError(error)) redirect("/login");

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Deactivate account</h2>
        <p className="text-body-md text-muted-foreground">
          Closing your account cannot be undone from this screen.
        </p>
      </div>

      {/* Without the flags there is no knowing whether the confirm needs a password. */}
      {failure || !connectedAccounts ? (
        <LoadError
          title="We could not load your sign-in methods."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-destructive/40 p-space-lg gap-space-md flex flex-col rounded-xl border">
          <div className="gap-space-xs flex flex-col">
            <h3 className="text-title-md text-destructive-subtle-foreground gap-space-xs flex items-center">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              Deactivate your account
            </h3>
            <p className="text-body-sm text-muted-foreground">
              You are signed out everywhere and your account stops working. Nothing on this screen
              brings it back.
            </p>
          </div>

          <DeactivateAccount passwordSet={connectedAccounts.passwordSet === true} />
        </div>
      )}
    </section>
  );
}
