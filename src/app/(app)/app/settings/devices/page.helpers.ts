/** How the devices page turns a device into the two strings it shows. */

import type { MyDevice } from "@/lib/devices/devices";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";

/** Names a device, falling back through what the backend managed to detect. */
export function deviceLabel(device: MyDevice): string {
  if (device.deviceName) return device.deviceName;

  const detected = [device.browserInfo, device.osVersion].filter(Boolean).join(" on ");
  return detected || "Unknown device";
}

/** Renders when a device was last seen, or nothing when it never said. */
export function lastSeen(device: MyDevice): string | null {
  const used = parseApiDateOrNull(device.lastUsed);
  if (!used) return null;

  // Fixed locale: this renders on the server, where the system one is the
  // container's rather than the reader's.
  return used.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
