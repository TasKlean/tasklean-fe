import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TwoFactorCard } from "@/components/app/two-factor-card";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import { getTwoFactorStatus } from "@/lib/account/two-factor";
import type { TwoFactorStatus } from "@/lib/account/two-factor.types";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Two-factor authentication",
};

/** Renders the account's second factor, and what is left of it. */
export default async function TwoFactorPage() {
  let status: TwoFactorStatus | null = null;
  let failure: string | null = null;

  try {
    status = await getTwoFactorStatus();
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
          A second step at sign-in, so a stolen password is not enough on its own.
        </p>
      </div>

      {failure || !status ? (
        <LoadError
          title="We could not load your two-factor settings."
          message={failure ?? "Please try again."}
        />
      ) : (
        <TwoFactorCard status={status} confirmedOn={confirmedOn} />
      )}
    </section>
  );
}
