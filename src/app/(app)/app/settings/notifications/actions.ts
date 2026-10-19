/**
 * The notifications page's Server Action. The form posts what should be on,
 * one batch writes it in a single transaction, and the answer is the backend's
 * own re-read, so nothing is fetched before or after.
 */

"use server";

import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import { saveNotificationSettings } from "@/lib/notifications/settings";
import {
  matrixFrom,
  type NotificationMatrix,
  NOTIFICATION_TYPES,
} from "@/lib/notifications/settings.types";
import { parseNotifications } from "@/lib/validation/forms/notifications.schema";

export type NotificationsActionState = {
  error: string | null;
  // The whole matrix, so the page shows what was saved rather than what was
  // asked for.
  settings?: NotificationMatrix;
  // The visible success state, since the page it returns to looks unchanged.
  done?: boolean;
};

/** Saves every switch the form reported, in one press. */
export async function saveNotificationsAction(
  _previous: NotificationsActionState,
  formData: FormData,
): Promise<NotificationsActionState> {
  // A checkbox group repeats its name, which `Object.fromEntries` collapses to
  // the last value, so the two lists are read with `getAll`.
  const parsed = parseNotifications({
    inApp: formData.getAll("inApp").map(String),
    email: formData.getAll("email").map(String),
  });
  // Only a tampered form reaches this: every value is a type name we rendered.
  if (!parsed.ok) return { error: GENERIC_FAILURE };

  const wanted = matrixFrom(parsed.values);
  let settings: NotificationMatrix;

  try {
    // Every type goes, so a change made on another device since this page
    // loaded is replaced by what the person in front of it chose.
    settings = await saveNotificationSettings(
      NOTIFICATION_TYPES.map((type) => ({ type, ...wanted[type] })),
    );
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  return { error: null, settings, done: true };
}
