/**
 * The device buttons' only input: which device. It goes through a schema like
 * every other form, so a tampered or missing id is refused here rather than
 * becoming a confusing 404 from the backend.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";

export const deviceActionSchema = z.object({
  // A hidden field, so it arrives as a string and has to be coerced.
  deviceId: z.pipe(
    z.string().check(z.regex(/^\d+$/, "Pick a device.")),
    z.transform((value) => Number(value)),
  ),
});

export type DeviceActionFields = z.infer<typeof deviceActionSchema>;

/** Parses the device a button was pressed for. */
export function parseDeviceAction(input: unknown): Parsed<DeviceActionFields> {
  return parseWith(deviceActionSchema, input);
}
