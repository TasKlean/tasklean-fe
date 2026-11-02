/**
 * What the browser asks a signature for. Not a form: the picker hands it over
 * from a hook, so it arrives as a plain object rather than as FormData, and it
 * is checked here because a Server Action's arguments come off the wire like
 * any other input. The bounds mirror the backend's own, so a request it would
 * refuse never spends one of the twenty signatures an hour allows.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  imageSizeRule,
  imageTypeRule,
  uidRule,
  uploadPurposeRule,
} from "@/lib/validation/rules/rules";

export const uploadRequestSchema = z.object({
  purpose: uploadPurposeRule,
  targetUid: uidRule("Pick what the picture is for."),
  contentType: imageTypeRule,
  sizeBytes: imageSizeRule,
});

export type UploadRequestFields = z.infer<typeof uploadRequestSchema>;

export type UploadRequestErrors = Partial<Record<keyof UploadRequestFields, string>>;

/** Parses the upload a picker asked to have signed. */
export function parseUploadRequest(input: unknown): Parsed<UploadRequestFields> {
  return parseWith(uploadRequestSchema, input);
}
