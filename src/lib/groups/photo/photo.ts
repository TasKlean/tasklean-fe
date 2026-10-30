/**
 * Whether a group's picture may be shown. One module, because the rule that
 * accepts a pasted link and the component that draws it have to agree: a URL
 * the form took and the avatar then refused would look like a lost save.
 *
 * No `server-only`: the form validates in the browser and a card renders there.
 */

/**
 * Reports whether this is a link a page may point an image at.
 *
 * `https` only. `javascript:` and `data:` are the reason for checking at all,
 * and plain `http` would be blocked as mixed content on a page served securely.
 */
export function isGroupPhotoUrl(photoUrl: string | null | undefined): photoUrl is string {
  if (!photoUrl) return false;

  try {
    return new URL(photoUrl).protocol === "https:";
  } catch {
    return false;
  }
}
