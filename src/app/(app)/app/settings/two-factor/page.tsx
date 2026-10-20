import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mail, MessageSquare } from "lucide-react";
import { getConnectedAccounts } from "@/lib/account/account";
import type { ConnectedAccounts } from "@/lib/account/account.types";
import { TwoFactorCard } from "@/components/app/two-factor-card";
import { TwoFactorEnroll } from "@/components/app/two-factor-enroll";
import { TwoFactorMethod } from "@/components/app/two-factor-method";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import { getTwoFactorStatus } from "@/lib/account/two-factor";
import type { TwoFactorStatus } from "@/lib/account/two-factor.types";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Two-factor authentication",
};

const PATH = "/app/settings/two-factor";

/** Renders the account's second factor, and the way to turn it on. */
export default async function TwoFactorPage() {
  let status: TwoFactorStatus | null = null;
  let connectedAccounts: ConnectedAccounts | null = null;
  let failure: string | null = null;

  try {
    // Both or neither: without the sign-in methods there is no knowing whether
    // starting setup needs a password.
    [status, connectedAccounts] = await Promise.all([getTwoFactorStatus(), getConnectedAccounts()]);
  } catch (error) {
    // A render cannot clear the cookie, so hand it back to Proxy via /login.
    if (isSessionExpiredError(error)) redirect("/login");

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  // Fixed locale: this renders on the server, where the system one is the
  // container's rather than the reader's.
  const confirmedOn =
    status?.confirmedAt?.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) ??
    null;

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Two-factor authentication</h2>
        <p className="text-body-md text-muted-foreground">
          When you sign in you are asked for a six-digit code from your authenticator app, or one of
          your recovery codes. A stolen password is then not enough to get into your account.
        </p>
      </div>

      {failure || !status || !connectedAccounts ? (
        <LoadError
          title="We could not load your two-factor settings."
          message={failure ?? "Please try again."}
        />
      ) : (
        <ul className="gap-space-md flex flex-col">
          <li>
            <TwoFactorCard status={status} confirmedOn={confirmedOn}>
              {/* Rendered whatever the state is, and it decides for itself. It
                  can be holding recovery codes that exist nowhere else, and
                  this re-renders the moment enabling reseals the session. */}
              <TwoFactorEnroll
                enabled={status.enabled}
                passwordSet={connectedAccounts.passwordSet === true}
                pendingSetup={status.pendingSetup}
                doneHref={PATH}
              />
            </TwoFactorCard>
          </li>

          {/* Listed, not hidden: the backend has only the authenticator, and
              saying so beats leaving people to wonder. */}
          <li>
            <TwoFactorMethod
              icon={Mail}
              name="Email"
              description="A code sent to the address you sign in with."
              available={false}
            />
          </li>

          <li>
            <TwoFactorMethod
              icon={MessageSquare}
              name="Text message"
              description="A code sent to your phone number."
              available={false}
            />
          </li>
        </ul>
      )}
    </section>
  );
}
