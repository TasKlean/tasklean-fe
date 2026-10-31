import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationsForm } from "@/components/app/settings/notifications/notifications-form/notifications-form";
import { BackLink } from "@/components/auth/back-link";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getNotificationSettings } from "@/lib/notifications/settings/settings";
import type { NotificationMatrix } from "@/lib/notifications/settings/settings.types";

export const metadata: Metadata = {
  title: "Notifications",
};

/** Renders the notification channels, one switch per type and channel. */
export default async function NotificationsPage() {
  let settings: NotificationMatrix | null = null;
  let failure: string | null = null;

  try {
    settings = await getNotificationSettings();
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

        <h2 className="text-headline-sm text-foreground">Notifications</h2>
        <p className="text-body-md text-muted-foreground">
          Manage what notifications you receive and where.
        </p>
      </div>

      {failure || !settings ? (
        <LoadError
          title="We could not load your notifications."
          message={failure ?? "Please try again."}
        />
      ) : (
        <NotificationsForm settings={settings} />
      )}
    </section>
  );
}
