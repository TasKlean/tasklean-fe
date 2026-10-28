import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/app/password-form/password-form";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import type { ConnectedAccounts } from "@/lib/account/account.types";
import { getConnectedAccounts } from "@/lib/account/account";
import { getTwoFactorStatus } from "@/lib/account/two-factor/two-factor";
import type { TwoFactorStatus } from "@/lib/account/two-factor/two-factor.types";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getCurrentUser } from "@/lib/users/me/me";

export const metadata: Metadata = {
  title: "Password",
};

/**
 * Says what this section does, which depends on whether there is a password.
 *
 * @param connectedAccounts Null when the read failed, where the line has to
 * stay true without knowing which case it is.
 */
function leadFor(connectedAccounts: ConnectedAccounts | null, passwordSet: boolean): ReactNode {
  if (!connectedAccounts) return "Your password for signing in with your email address.";

  if (passwordSet) {
    return (
      <>
        <span className="text-foreground font-semibold">Change your password</span>. Doing that will
        sign you out of all your other devices.
      </>
    );
  }

  return (
    <>
      You signed up with <span className="text-foreground font-semibold">Google</span>.{" "}
      <span className="text-foreground font-semibold">Create a password</span> to sign in with
      email/password as well.
    </>
  );
}

/** Renders the password section: changing one, or setting the first. */
export default async function PasswordPage() {
  let connectedAccounts: ConnectedAccounts | null = null;
  let status: TwoFactorStatus | null = null;
  let email: string | null = null;
  let failure: string | null = null;

  try {
    // Both or neither: a form that leaves out the code an active factor needs
    // would be refused by the backend with nothing the reader could fix. The
    // profile is best effort, since it only prefills the reset link.
    const [accounts, twoFactor, profile] = await Promise.all([
      getConnectedAccounts(),
      getTwoFactorStatus(),
      getCurrentUser().catch(() => null),
    ]);
    connectedAccounts = accounts;
    status = twoFactor;
    email = profile?.email ?? null;
  } catch (error) {
    // A render cannot clear the cookie, so hand it back to Proxy via /login.
    if (isSessionExpiredError(error)) redirect("/login");

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  const passwordSet = connectedAccounts?.passwordSet === true;
  const lead = leadFor(connectedAccounts, passwordSet);

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Password</h2>
        <p className="text-body-md text-muted-foreground">{lead}</p>
      </div>

      {/* Without the flags there is no telling a change from a first password, so the form stays away. */}
      {failure || !connectedAccounts || !status ? (
        <LoadError
          title="We could not load your sign-in methods."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-border/60 p-space-lg rounded-xl border">
          <PasswordForm passwordSet={passwordSet} twoFactorEnabled={status.enabled} email={email} />
        </div>
      )}
    </section>
  );
}
