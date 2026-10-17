import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleConnection } from "@/components/app/google-connection";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import type { ConnectedAccounts } from "@/lib/account/account.types";
import { getConnectedAccounts } from "@/lib/account/account";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server";
import { NONCE_HEADER_NAME } from "@/lib/auth/google-nonce";

export const metadata: Metadata = {
  title: "Connected Accounts",
};

/** Renders the accounts that can sign in to this one. */
export default async function ConnectedAccountsPage() {
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

  const nonceHash = (await headers()).get(NONCE_HEADER_NAME);

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Connected Accounts</h2>
        <p className="text-body-md text-muted-foreground">
          The accounts you can sign in with, alongside your email address.
        </p>
      </div>

      {/* Unlinking is refused without a password, so both flags are needed before anything renders. */}
      {failure || !connectedAccounts ? (
        <LoadError
          title="We could not load your connections."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-border/60 p-space-lg gap-space-md flex flex-col rounded-xl border">
          <div className="gap-space-xs flex flex-col">
            <h3 className="text-title-md text-foreground">Google</h3>
            <p className="text-body-sm text-muted-foreground">
              {connectedAccounts.googleLinked === true
                ? "You can sign in with Google on this account."
                : "Link your Google account to sign in with one tap."}
            </p>
          </div>

          <GoogleConnection
            linked={connectedAccounts.googleLinked === true}
            passwordSet={connectedAccounts.passwordSet === true}
            nonceHash={nonceHash}
          />
        </div>
      )}
    </section>
  );
}
