/**
 * The bytes of one uploaded image, served through us rather than from the
 * bucket. The bucket is private and its read URLs are credentials that change
 * on every read, so a browser is never handed one.
 *
 * `/api` is outside Proxy's matcher, so nothing above this checks the session
 * and nothing refreshes it: a dead one surfaces as a 401 from the read itself.
 */

import { NextResponse } from "next/server";
import * as z from "zod/mini";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { readUpload } from "@/lib/uploads/uploads";
import { uidRule } from "@/lib/validation/rules/rules";

// Immutable because replacing a photo mints a new uid, and `private` because
// Cloudflare would otherwise serve one household's picture to the next caller.
const CACHE = "private, max-age=3600, immutable";

// The bound the backend's own column has. The message is never rendered: a uid
// this rejects is a miss, not a field anybody can correct.
const UID = uidRule("Not an upload uid.");

/**
 * Turns a failed read into a status.
 *
 * A 403 is the backend's answer for a uid that does not exist as well as for
 * one that is not the caller's to see, so both become a miss and neither says
 * which it was.
 */
function statusFor(error: unknown): number {
  if (isSessionExpiredError(error)) return 401;
  if (isApiError(error)) return 404;
  return 500;
}

/**
 * Streams an uploaded image to a caller the backend allows to see it.
 *
 * @returns The bytes with the type they were stored as, 401 with no session,
 * 404 for an image that is not this caller's or whose object is gone, and 502
 * where the bucket could not answer for it at all.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/image/[uid]">,
): Promise<NextResponse> {
  const { uid } = await context.params;
  const parsed = z.safeParse(UID, uid);

  if (!parsed.success) return new NextResponse(null, { status: 404 });

  let signed: string;
  try {
    signed = await readUpload(parsed.data);
  } catch (error) {
    return new NextResponse(null, { status: statusFor(error) });
  }

  // The one raw fetch outside `api/client`: this is the bucket rather than our
  // API, so there is no envelope to unwrap and the body is bytes, not JSON.
  const object = await fetch(signed).catch(() => null);

  // A key that is not in the bucket is a miss, the same as a uid the backend
  // refuses: nothing upstream is broken, so it is not a bad gateway.
  if (object?.status === 404) return new NextResponse(null, { status: 404 });
  if (!object?.ok || !object.body) return new NextResponse(null, { status: 502 });

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": CACHE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
