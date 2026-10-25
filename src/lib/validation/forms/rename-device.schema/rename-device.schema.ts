/**
 * The rename form: which device, and what to call it. The name is trimmed here,
 * so a row never ends up named with the whitespace someone pasted around it.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { deviceIdRule, deviceNameRule } from "@/lib/validation/rules/rules";

export const renameDeviceSchema = z.object({
  deviceId: deviceIdRule,
  name: deviceNameRule,
});

export type RenameDeviceFields = z.infer<typeof renameDeviceSchema>;

/** Parses the device and the name a rename was submitted with. */
export function parseRenameDevice(input: unknown): Parsed<RenameDeviceFields> {
  return parseWith(renameDeviceSchema, input);
}
