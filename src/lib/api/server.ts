/**
 * The session-aware entry point for API calls; everything above the API layer
 * uses this rather than `request()` directly.
 *
 * It deliberately does not refresh on 401. Refreshing means persisting a
 * rotated pair, which a Server Component render cannot do — so it would revoke
 * the stored token with no way to save its replacement. Proxy refreshes before
 * the request gets here, so a 401 that still arrives means the session is over.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { RequestOptions } from "@/lib/api/client.types";
import { isApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";

export class SessionExpiredError extends Error {
  constructor(message = "No valid session. Sign in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Narrows an unknown caught value to `SessionExpiredError`.
 */
export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

/**
 * Calls the API with the current session's access token.
 *
 * @param options As `request()`, minus `accessToken` — the session supplies it.
 * @throws SessionExpiredError when there is no session, or the API returns 401.
 * @throws ApiError for every other failure, including 403: authenticated but
 * not allowed is a permission problem, not a session one.
 */
export async function serverApi<T>(
  path: string,
  options: Omit<RequestOptions, "accessToken"> = {},
): Promise<T> {
  const session = await getSession();
  if (!session) throw new SessionExpiredError();

  try {
    return await request<T>(path, { ...options, accessToken: session.accessToken });
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      throw new SessionExpiredError();
    }
    throw error;
  }
}
