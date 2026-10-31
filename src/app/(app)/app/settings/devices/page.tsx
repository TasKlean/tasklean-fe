import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { deviceLabel, lastSeen } from "@/app/(app)/app/settings/devices/page.helpers";
import { BackLink } from "@/components/auth/back-link";
import { DeviceRow } from "@/components/app/settings/devices/device-row/device-row";
import { AllDeviceActions } from "@/components/app/settings/devices/all-device-actions/all-device-actions";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { isMobileDevice, listMyDevices, type MyDevice } from "@/lib/devices/devices";

export const metadata: Metadata = {
  title: "Devices and sessions",
};

/** Renders every device the account has signed in from. */
export default async function DevicesPage() {
  let devices: MyDevice[] = [];
  let failure: string | null = null;

  try {
    devices = await listMyDevices();
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  let body: ReactNode;
  if (failure) {
    body = <LoadError title="We could not load your devices." message={failure} />;
  } else if (devices.length === 0) {
    body = (
      <p className="text-body-md text-muted-foreground bg-card border-border/60 p-space-lg rounded-xl border">
        No devices yet. This one appears the next time you sign in.
      </p>
    );
  } else {
    body = (
      <>
        <ul className="gap-space-sm flex flex-col">
          {devices.map((device) => (
            <DeviceRow
              key={device.id ?? deviceLabel(device)}
              id={device.id ?? null}
              label={deviceLabel(device)}
              mobile={isMobileDevice(device)}
              current={device.currentDevice === true}
              active={device.activeSession === true}
              ipAddress={device.ipAddress ?? null}
              lastUsed={lastSeen(device)}
            />
          ))}
        </ul>

        <AllDeviceActions />
      </>
    );
  }

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Devices and sessions</h2>
        <p className="text-body-md text-muted-foreground">
          Manage the devices you have signed in with in the past.
        </p>
      </div>

      {body}
    </section>
  );
}
