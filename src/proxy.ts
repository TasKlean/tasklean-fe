/**
 * The auth boundary, and the only place a rotated token pair can be persisted on
 * the navigation path. Named `proxy.ts` because Next 16 renamed Middleware; a
 * `middleware.ts` would never run.
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  NONCE_COOKIE_NAME,
  NONCE_COOKIE_OPTIONS,
  NONCE_HEADER_NAME,
  createNonce,
  hashNonce,
} from "@/lib/auth/google-nonce";
import { accessTokenExpiresWithin } from "@/lib/auth/tokens/access-token";
import { SIGNED_IN_HOME } from "@/lib/auth/safe-next";
import { refreshTokens } from "@/lib/auth/tokens/refresh";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  type Session,
  sealSession,
  unsealSession,
} from "@/lib/auth/session";

export const config = {
  // `/api` excluded: Route Handlers must answer 401, not redirect to HTML.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};

// Default deny: adding a route must not require remembering to protect it.
const PUBLIC_PATHS = ["/", "/login", "/register", "/verify-email"];

// The public paths a session makes pointless. `/` is public but not here: it
// stays readable while signed in, or the redirect below would loop onto itself.
const AUTH_PATHS = ["/login", "/register", "/verify-email"];

// The screens carrying a Google button, which cannot mint their own nonce.
const GOOGLE_PATHS = ["/login", "/register"];

/**
 * Reports whether a path is in a list, by exact match or as a path prefix.
 *
 * The prefix is what makes `/login/callback` match `/login`. `"/"` is the one
 * exception and matches exactly, since as a prefix it would claim every route.
 */
function matches(paths: readonly string[], pathname: string): boolean {
  return paths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

/** Reports whether a path is reachable without a session. */
function isPublic(pathname: string): boolean {
  return matches(PUBLIC_PATHS, pathname);
}

/**
 * Hands the page a nonce for Google's widget, minting one if there isn't one.
 *
 * Reused rather than rotated per request: a link prefetch is a request too, and
 * rotating there would leave the visible page holding a hash the cookie no
 * longer matches. Single use is enforced where it belongs, on the attempt.
 *
 * @returns The response, carrying the hash forward and the raw nonce back.
 */
async function withGoogleNonce(request: NextRequest): Promise<NextResponse> {
  const existing = request.cookies.get(NONCE_COOKIE_NAME)?.value;
  const nonce = existing ?? createNonce();

  const headers = new Headers(request.headers);
  headers.set(NONCE_HEADER_NAME, await hashNonce(nonce));

  const response = NextResponse.next({ request: { headers } });
  if (!existing) response.cookies.set(NONCE_COOKIE_NAME, nonce, NONCE_COOKIE_OPTIONS);
  return response;
}

/**
 * Clears a Google nonce that a session has made pointless.
 *
 * Only the Google action spends one, so a password login leaves it behind
 * until it expires. Proxy mints it, so Proxy is where it gets cleaned up.
 *
 * @returns The same response, for use at a return site.
 */
function dropSpentNonce(request: NextRequest, response: NextResponse): NextResponse {
  if (request.cookies.has(NONCE_COOKIE_NAME)) response.cookies.delete(NONCE_COOKIE_NAME);
  return response;
}

/**
 * Builds the redirect to `/login`, preserving where the visitor was headed.
 *
 * @returns A redirect carrying a `next` parameter for login to return them to.
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL("/login", request.nextUrl);
  // Preserved so login can return them where they were headed.
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

/**
 * Guards every matched route: redirects anonymous visitors to `/login`,
 * refreshes a near-expiry token pair and persists the rotation, and drops the
 * session when refresh is refused.
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    if (matches(GOOGLE_PATHS, pathname)) return withGoogleNonce(request);
    if (isPublic(pathname)) return NextResponse.next();

    const response = redirectToLogin(request);
    // A cookie that exists but no longer unseals would otherwise be resent on
    // every request forever.
    if (request.cookies.has(SESSION_COOKIE_NAME)) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // Only the auth screens: every other public page, the marketing page
  // included, stays readable while signed in.
  if (matches(AUTH_PATHS, pathname)) {
    return dropSpentNonce(request, NextResponse.redirect(new URL(SIGNED_IN_HOME, request.nextUrl)));
  }

  if (!accessTokenExpiresWithin(session.accessToken)) {
    return dropSpentNonce(request, NextResponse.next());
  }

  try {
    const refreshed = await refreshTokens(session.refreshToken);
    const rotated: Session = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      userUid: refreshed.userUid || session.userUid,
      name: refreshed.name || session.name,
    };

    const response = NextResponse.next();
    // Writing this back is not optional: the backend has already revoked the
    // old refresh token, so losing the new one ends the session.
    response.cookies.set(SESSION_COOKIE_NAME, await sealSession(rotated), SESSION_COOKIE_OPTIONS);
    return dropSpentNonce(request, response);
  } catch {
    // Spent, revoked, or refused — there is no recovery from here.
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
