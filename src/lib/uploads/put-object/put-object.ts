/**
 * The bytes, browser to bucket. The presigned URL is itself the credential, so
 * nothing of ours may ride along, and the content type has to be sent back
 * exactly as it was signed or the bucket refuses the body it would otherwise
 * have taken.
 */

import type { ImageType } from "@/lib/uploads/uploads.types";

export const UPLOAD_FAILED = "That picture could not be sent. Please try again.";

/**
 * PUTs an image to a presigned URL.
 *
 * @returns Whether the bucket took it. A refusal says nothing useful about why,
 * since the body is XML from a service the reader has never heard of.
 */
export async function putObject(url: string, blob: Blob, type: ImageType): Promise<boolean> {
  // Cross-origin, so `fetch` sends no cookie unless asked, and it is not asked.
  const response = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": type },
  }).catch(() => null);

  return response?.ok === true;
}
