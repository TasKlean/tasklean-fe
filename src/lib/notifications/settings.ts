/**
 * The caller's own notification channels. Saving one is a preference and
 * nothing more: no email is sent and no in-app row is written yet.
 */

import "server-only";

import { serverApi } from "@/lib/api/server";
import {
  asChannels,
  type NotificationMatrix,
  type NotificationSettingEntry,
  type NotificationSettingResponse,
  NOTIFICATION_TYPES,
} from "@/lib/notifications/settings.types";

const PATH = "/api/notification-settings";

/**
 * Narrows a list of entries into one row per type we offer.
 *
 * @returns Every type, whatever the list held: the backend answers with all of
 * them, but no field in it is guaranteed.
 */
function toMatrix(entries: NotificationSettingResponse[] | undefined): NotificationMatrix {
  const answered = Array.isArray(entries) ? entries : [];

  // The cast is `fromEntries` widening the key back to string; the map runs
  // over our own list, so every type is present.
  return Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [
      type,
      asChannels(answered.find((entry) => entry.type === type)),
    ]),
  ) as NotificationMatrix;
}

/**
 * Reads the caller's channels for every notification type.
 *
 * @throws SessionExpiredError when the session is gone or refused.
 * @throws ApiError for every other failure.
 */
export async function getNotificationSettings(): Promise<NotificationMatrix> {
  return toMatrix(await serverApi<NotificationSettingResponse[]>(PATH));
}

/**
 * Replaces the channels of the types it is given, in one transaction.
 *
 * @param entries One per type to change, each a full replace. Omitted types
 * are left alone, and an empty list is a 400, so a save with nothing in it
 * must not call this.
 * @returns The whole matrix, re-read by the backend after the writes rather
 * than echoed, so a change another device made comes back with it.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function saveNotificationSettings(
  entries: NotificationSettingEntry[],
): Promise<NotificationMatrix> {
  return toMatrix(
    await serverApi<NotificationSettingResponse[]>(`${PATH}/batch`, {
      method: "PUT",
      body: { settings: entries },
    }),
  );
}
