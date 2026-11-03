/**
 * The one Server Action that has an upload signed. Every purpose shares it,
 * because what an image is for is a field in the request rather than a
 * different endpoint, and it sits under a segment with no page so the directory
 * is an action and not a route.
 *
 * It is called from a hook rather than from a form, so its argument is a plain
 * object. That object still arrives off the wire, so it is parsed like anything
 * else a browser sends.
 */

"use server";

import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure/action-failure";
import { isApiError } from "@/lib/api/errors";
import { requestUpload, UPLOAD_REFUSED } from "@/lib/uploads/uploads";
import {
  parseUploadRequest,
  type UploadRequestErrors,
} from "@/lib/validation/forms/upload-request.schema/upload-request.schema";

export type UploadTicket =
  { ok: true; uid: string; uploadUrl: string } | { ok: false; message: string };

/** Picks the one message to show, since there is no field here to mark. */
function firstMessage(errors: UploadRequestErrors): string {
  return Object.values(errors)[0] ?? GENERIC_FAILURE;
}

/**
 * Asks the backend to sign an upload of bytes the browser already holds.
 *
 * @param fields A measured `UploadRequest`: what the image is for, what it
 * belongs to, and the exact type and length the PUT will send.
 * @returns Where to send the bytes and the uid to attach afterwards, or the
 * line to show. A refusal is an answer rather than a throw, because the hook
 * that calls this has a failure slot and no error boundary around it.
 */
export async function requestUploadAction(fields: unknown): Promise<UploadTicket> {
  const parsed = parseUploadRequest(fields);
  if (!parsed.ok) return { ok: false, message: firstMessage(parsed.errors) };

  try {
    const signed = await requestUpload(parsed.values);
    return { ok: true, ...signed };
  } catch (error) {
    // Never retried: the limit counts refusals too, so a second press would
    // cost a second token and the reader has to be told rather than waited for.
    if (isApiError(error) && error.status === 403) return { ok: false, message: UPLOAD_REFUSED };
    return { ok: false, message: actionFailureMessage(error) };
  }
}
