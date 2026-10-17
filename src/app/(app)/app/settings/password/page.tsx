import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/app/password-form";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import type { ConnectedAccounts } from "@/lib/account/account.types";
import { getConnectedAccounts } from "@/lib/account/account";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Password",
};

/** Renders the password section: changing one, or setting the first. */
export default async function PasswordPage() {
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

  const passwordSet = connectedAccounts?.passwordSet === true;

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Password</h2>
        <p className="text-body-md text-muted-foreground">
          {!connectedAccounts
            ? "Your password for signing in with your email address."
            : passwordSet
              ? "Changing it signs out every other device. This one stays signed in."
              : "You signed up with Google. A password lets you sign in with your email address as well."}
        </p>
      </div>

      {/* Without the flags there is no telling a change from a first password, so the form stays away. */}
      {failure || !connectedAccounts ? (
        <LoadError
          title="We could not load your sign-in methods."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-border/60 p-space-lg rounded-xl border">
          <PasswordForm passwordSet={passwordSet} />
        </div>
      )}
    </section>
  );
}
