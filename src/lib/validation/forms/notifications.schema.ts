/**
 * The notifications form: one list of types per channel, exactly as a group of
 * checkboxes submits it. Anything missing from a list is off, so the form says
 * what should be on rather than what changed.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse";
import { notificationTypeRule } from "@/lib/validation/rules";

export const notificationsSchema = z.object({
  inApp: z.array(notificationTypeRule),
  email: z.array(notificationTypeRule),
});

export type NotificationsFields = z.infer<typeof notificationsSchema>;

/** Parses the two checked lists a save carries. */
export function parseNotifications(input: unknown): Parsed<NotificationsFields> {
  return parseWith(notificationsSchema, input);
}
