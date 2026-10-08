// The session-aware entry point for API calls. Everything above the API layer
// should use this rather than `request()` directly.
//
// It does NOT refresh on 401, on purpose. Refreshing means writing a rotated
// token pair back to the cookie, and a Server Component render cannot set
// cookies — so a refresh here would revoke the stored token with no way to save
// its replacement, killing the session. Refresh happens in middleware, before
// the request reaches any of this. A 401 that still arrives means the session
// is genuinely finished.

import "server-only";

import { type RequestOptions, request } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/session";

export class SessionExpiredError extends Error {
  constructor(message = "No valid session. Sign in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

export async function serverApi<T>(
  path: string,
  options: Omit<RequestOptions, "accessToken"> = {},
): Promise<T> {
  const session = await getSession();
  if (!session) throw new SessionExpiredError();

  try {
    return await request<T>(path, { ...options, accessToken: session.accessToken });
  } catch (error) {
    // 401 means the token is gone or rejected -> the session is over.
    // 403 is NOT a session problem: the user is authenticated but not allowed,
    // so it passes through as an ApiError for the UI to explain.
    if (isApiError(error) && error.status === 401) {
      throw new SessionExpiredError();
    }
    throw error;
  }
}
