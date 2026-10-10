/**
 * The auth boundary, and the only place a rotated token pair can be persisted on
 * the navigation path. Named `proxy.ts` because Next 16 renamed Middleware; a
 * `middleware.ts` would never run.
 */

import { type NextRequest, NextResponse } from "next/server";
import { accessTokenExpiresWithin } from "@/lib/auth/tokens/access-token";
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

/**
 * Reports whether a path is reachable without a session.
 *
 * Matches a prefix as well as the exact path, so `/login/callback` is public
 * because `/login` is. `"/"` is the one exception and matches exactly.
 */
function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
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
    if (isPublic(pathname)) return NextResponse.next();

    const response = redirectToLogin(request);
    // A cookie that exists but no longer unseals would otherwise be resent on
    // every request forever.
    if (request.cookies.has(SESSION_COOKIE_NAME)) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // Signed in, so the auth screens have nothing to offer.
  if (isPublic(pathname)) return NextResponse.redirect(new URL("/", request.nextUrl));

  if (!accessTokenExpiresWithin(session.accessToken)) return NextResponse.next();

  try {
    const refreshed = await refreshTokens(session.refreshToken);
    const rotated: Session = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      userUid: refreshed.userUid || session.userUid,
    };

    const response = NextResponse.next();
    // Writing this back is not optional: the backend has already revoked the
    // old refresh token, so losing the new one ends the session.
    response.cookies.set(SESSION_COOKIE_NAME, await sealSession(rotated), SESSION_COOKIE_OPTIONS);
    return response;
  } catch {
    // Spent, revoked, or refused — there is no recovery from here.
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
