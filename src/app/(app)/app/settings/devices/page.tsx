import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deviceLabel, lastSeen } from "@/app/(app)/app/settings/devices/page.helpers";
import { BackLink } from "@/components/auth/back-link";
import { DeviceRow } from "@/components/app/device-row/device-row";
import { SignOutEverywhere } from "@/components/app/sign-out-everywhere";
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

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Devices and sessions</h2>
        <p className="text-body-md text-muted-foreground">
          Every browser you have signed in from. Removing one signs it out.
        </p>
      </div>

      {failure ? (
        <LoadError title="We could not load your devices." message={failure} />
      ) : devices.length === 0 ? (
        <p className="text-body-md text-muted-foreground bg-card border-border/60 p-space-lg rounded-xl border">
          No devices yet. This one appears the next time you sign in.
        </p>
      ) : (
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

          <SignOutEverywhere />
        </>
      )}
    </section>
  );
}
