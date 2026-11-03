/**
 * Signed URLs for an uploaded image: one to PUT the bytes to, and one to read
 * them back from. Only URLs move through here, since the bytes go browser to
 * bucket and never reach this process.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type {
  SignedUpload,
  SignedUrlResponse,
  UploadRequest,
  UploadResponse,
} from "@/lib/uploads/uploads.types";

const UPLOADS_PATH = "/api/uploads";

// The one code an attach is refused with. Which of the backend's checks caught
// it is deliberately not exposed, and the remedy is the same either way.
export const UPLOAD_NOT_USABLE = "UPLOAD_NOT_USABLE";

// What a refused presign says. A 403 covers a target that is not the caller's
// and one that never existed alike, so the line names neither cause.
export const UPLOAD_REFUSED =
  "You cannot add a picture to that group. You may no longer be an admin of it.";

/**
 * Asks for a signed URL to upload one image to.
 *
 * The content type and the exact byte count are both inside the signature, so
 * the bytes have to be final before this runs: resize first, then ask.
 *
 * @returns The upload's uid, which is what an entity is pointed at afterwards,
 * and the URL to PUT to.
 * @throws TypeError when a 2xx arrives without both of them, since neither is
 * any use alone.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 403 means "not yours to upload for" and never "no such target", because the
 * check runs before the target is resolved. 429 is the upload bucket, twenty an
 * hour, which a refusal spends as well.
 */
export async function requestUpload(fields: UploadRequest): Promise<SignedUpload> {
  const response = await serverApi<UploadResponse>(UPLOADS_PATH, {
    method: "POST",
    body: fields,
  });

  if (typeof response?.uid !== "string" || typeof response?.uploadUrl !== "string") {
    throw new TypeError("An upload was signed but came back with nothing to upload to.");
  }

  return { uid: response.uid, uploadUrl: response.uploadUrl };
}

/**
 * Asks where an uploaded image may be read from.
 *
 * @returns The signed URL alone. Its lifetime is not returned, because what
 * gets cached is the bytes rather than the URL.
 * @throws TypeError when a 2xx carries no URL.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 403 covers a uid that does not exist as well as one that is not the caller's
 * to see, so it must never be reported as a missing image.
 */
export async function readUpload(uid: string): Promise<string> {
  const response = await serverApi<SignedUrlResponse>(`${UPLOADS_PATH}/${encodeURIComponent(uid)}`);

  if (typeof response?.url !== "string") {
    throw new TypeError("An upload was readable but came back with no URL.");
  }

  return response.url;
}
