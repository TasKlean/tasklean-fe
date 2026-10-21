/**
 * Whether `next/image` may be pointed at a photo. The optimizer throws on a
 * host it was not configured with, which would take the whole page with it.
 */

// Must stay in step with `next.config.ts`'s remotePatterns.
const ALLOWED_DOMAIN = "googleusercontent.com";

/** Reports whether the optimizer is configured to fetch this photo. */
export function isRenderable(photoUrl: string): boolean {
  try {
    const { hostname } = new URL(photoUrl);
    // The leading dot matters: without it `evilgoogleusercontent.com` passes.
    return hostname === ALLOWED_DOMAIN || hostname.endsWith(`.${ALLOWED_DOMAIN}`);
  } catch {
    return false;
  }
}
