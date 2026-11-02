/**
 * Where a group's picture is read from. The bucket is private, so a group
 * carries an upload's uid rather than a URL, and the only address a browser may
 * be handed is our own route: it signs the read behind the session and streams
 * the bytes back, so no signed URL ever reaches a page.
 *
 * No `server-only`: the avatar that calls this renders in the browser as well.
 */

const IMAGE_PATH = "/api/image";

/**
 * Builds what an image element may point at for a group's picture.
 *
 * @returns The path to read it from, or null when the group has no picture. The
 * uid is encoded, since it goes back out as a path segment.
 */
export function groupPhotoSrc(photoUid: string | null | undefined): string | null {
  const uid = photoUid?.trim();
  if (!uid) return null;

  return `${IMAGE_PATH}/${encodeURIComponent(uid)}`;
}
