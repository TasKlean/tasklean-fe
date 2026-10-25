import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { GoogleConnection } from "@/components/app/google-connection";
import { BackLink } from "@/components/auth/back-link";
import { GoogleMark } from "@/components/common/google-mark";
import { LoadError } from "@/components/common/load-error";
import type { ConnectedAccounts } from "@/lib/account/account.types";
import { getConnectedAccounts } from "@/lib/account/account";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { NONCE_HEADER_NAME } from "@/lib/auth/google-nonce/google-nonce";

export const metadata: Metadata = {
  title: "Connected accounts",
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

        <h2 className="text-headline-sm text-foreground">Connected accounts</h2>
        <p className="text-body-md text-muted-foreground">
          Connected accounts that let you sign in.
        </p>
      </div>

      {/* Unlinking is refused without a password, so both flags are needed before anything renders. */}
      {failure || !connectedAccounts ? (
        <LoadError
          title="We could not load your connected accounts."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-border/60 p-space-lg gap-space-md flex flex-col rounded-xl border">
          {/* A row at every width, so the state reads as this account's badge
              rather than as a banner over the control below it. */}
          <div className="gap-space-md flex items-start justify-between">
            <div className="gap-space-xs flex min-w-0 flex-col">
              <h3 className="text-title-md text-foreground gap-space-sm flex items-center">
                <GoogleMark />
                Google
              </h3>
              <p className="text-body-sm text-muted-foreground">
                {connectedAccounts.googleLinked === true
                  ? "You can sign in with Google on this account."
                  : "Link your Google account to sign in with one tap."}
              </p>
            </div>

            {connectedAccounts.googleLinked === true ? (
              <span className="text-label-sm bg-success-subtle text-success-subtle-foreground px-space-sm inline-flex shrink-0 items-center gap-1.5 rounded-full py-1">
                <BadgeCheck className="size-4" aria-hidden />
                Connected
              </span>
            ) : null}
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
