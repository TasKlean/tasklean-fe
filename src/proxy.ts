// The auth boundary, and the only place a rotated token pair can be persisted
// on the navigation path.
//
// Next 16 renamed Middleware to Proxy; the file convention is `src/proxy.ts`.
//
// Next's guidance is to keep Proxy cheap and avoid network calls, because it
// runs on every route including prefetches. We make exactly one, and only when
// `accessTokenExpiresWithin` says the access token is about to die — roughly
// once per 15 minutes per session, not once per request. The alternative is
// worse: a Server Component render cannot set cookies, so a 401 reached during
// rendering can only log the user out, which would cap every session at the
// access-token lifetime.

import { type NextRequest, NextResponse } from "next/server";
import { accessTokenExpiresWithin } from "@/lib/auth/access-token";
import { refreshTokens } from "@/lib/auth/refresh";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  type Session,
  sealSession,
  unsealSession,
} from "@/lib/session";

// Default deny: everything is protected unless it is listed here. Adding a
// route should not require remembering to protect it.
const PUBLIC_PATHS = ["/login", "/register", "/verify-email"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL("/login", request.nextUrl);
  // Preserve the destination so login can return them to it.
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    if (isPublic(pathname)) return NextResponse.next();

    // Clear a cookie that exists but no longer unseals (tampered or expired),
    // so the browser stops sending it on every subsequent request.
    const response = redirectToLogin(request);
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
    response.cookies.set(SESSION_COOKIE_NAME, await sealSession(rotated), SESSION_COOKIE_OPTIONS);
    return response;
  } catch {
    // The refresh token is spent, revoked or the backend refused. There is no
    // recovery: drop the session rather than leaving a dead cookie in place.
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  // Skips Next internals and static assets. `/api` is excluded deliberately:
  // our own Route Handlers must answer with a 401 rather than a redirect to an
  // HTML page, so they do their own session handling via serverApi().
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
