import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppearanceForm } from "@/components/app/settings/appearance/appearance-form/appearance-form";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getPreferences } from "@/lib/preferences/preferences";
import type { Preferences } from "@/lib/preferences/preferences.types";

export const metadata: Metadata = {
  title: "Appearance",
};

/** Renders the colour scheme picker. */
export default async function AppearancePage() {
  let preferences: Preferences | null = null;
  let failure: string | null = null;

  try {
    preferences = await getPreferences();
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

        <h2 className="text-headline-sm text-foreground">Appearance</h2>
        <p className="text-body-md text-muted-foreground">
          Choose what theme you will use. Applies on all devices this account uses.
        </p>
      </div>

      {failure || !preferences ? (
        <LoadError
          title="We could not load your appearance."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-border/60 p-space-lg rounded-xl border">
          <AppearanceForm theme={preferences.theme} />
        </div>
      )}
    </section>
  );
}
