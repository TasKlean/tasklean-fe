/**
 * Notifications for this group alone, which the backend cannot store yet: its
 * settings are one row per account and type, with no group on them. The control
 * says so and points at the account-wide ones, which do work.
 */

import { Bell } from "lucide-react";
import Link from "next/link";
import { BUTTON, QUIET_BUTTON } from "@/components/app/group-settings/group-settings.styles";

/** Renders the per-group notification control, and the account-wide way there. */
export function GroupNotifications() {
  return (
    <div className="gap-space-sm flex flex-col">
      <div className="gap-space-xs flex flex-wrap items-center">
        <button
          type="button"
          disabled
          aria-label="Choose this group's notifications, coming soon"
          className={`${BUTTON} border-border/60 text-muted-foreground`}
        >
          <Bell className="size-4" aria-hidden />
          Choose this group&apos;s notifications
        </button>

        <Link href="/app/settings/notifications" className={QUIET_BUTTON}>
          Account notifications
        </Link>
      </div>

      <p className="text-label-sm text-muted-foreground">
        Coming soon. For now every group follows the notification settings on your account.
      </p>
    </div>
  );
}
