import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/auth/back-link";
import { DeviceRow } from "@/components/app/device-row";
import { SignOutEverywhere } from "@/components/app/sign-out-everywhere";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server";
import { type MyDevice, isMobileDevice, listMyDevices } from "@/lib/devices/devices";
import { parseApiDateOrNull } from "@/lib/time/api-date";

export const metadata: Metadata = {
  title: "Devices and sessions",
};

/** Names a device, falling back through what the backend managed to detect. */
function deviceLabel(device: MyDevice): string {
  if (device.deviceName) return device.deviceName;

  const detected = [device.browserInfo, device.osVersion].filter(Boolean).join(" on ");
  return detected || "Unknown device";
}

/** Renders when a device was last seen, or nothing when it never said. */
function lastSeen(device: MyDevice): string | null {
  const used = parseApiDateOrNull(device.lastUsed);
  if (!used) return null;

  // Fixed locale: this renders on the server, where the system one is the
  // container's rather than the reader's.
  return used.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

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
