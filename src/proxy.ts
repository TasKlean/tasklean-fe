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
} from "@/lib/auth/google-nonce/google-nonce";
import {
  DEVICE_COOKIE_NAME,
  DEVICE_COOKIE_OPTIONS,
  buildDeviceHeaders,
  createDeviceId,
} from "@/lib/auth/device/device";
import { accessTokenExpiresWithin } from "@/lib/auth/tokens/access-token/access-token";
import { SIGNED_IN_HOME, TWO_FACTOR_PROMPT } from "@/lib/auth/safe-next/safe-next";
import { refreshTokens } from "@/lib/auth/tokens/refresh/refresh";
import { CHALLENGE_COOKIE_NAME } from "@/lib/auth/two-factor-challenge/two-factor-challenge";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  type Session,
  sealSession,
  unsealSession,
} from "@/lib/auth/session/session";
import { fetchPreferences } from "@/lib/preferences/preferences";
import type { Theme } from "@/lib/preferences/preferences.types";
import {
  THEME_COOKIE_NAME,
  THEME_COOKIE_OPTIONS,
} from "@/lib/preferences/theme-cookie/theme-cookie";

export const config = {
  // `/api` excluded: Route Handlers must answer 401, not redirect to HTML.
  matcher: [
    // An escaped string, not String.raw: Next reads this export statically, and a
    // tagged template fails the build as an invalid segment config.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};

// Default deny: adding a route must not require remembering to protect it.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  TWO_FACTOR_PROMPT,
];

// The public paths a session makes pointless. `/` is public but not here: it
// stays readable while signed in, or the redirect below would loop onto itself.
// `/reset-password` is not here either: an emailed link has to work even for
// someone whose browser still holds a session, and finishing the reset kills it.
// The prompt is one of them: it finishes a sign-in, so a session has already
// made it pointless, and it needs the device id the verify call sends.
const AUTH_PATHS = ["/login", "/register", "/verify-email", "/forgot-password", TWO_FACTOR_PROMPT];

// The screens carrying a Google button, which cannot mint their own nonce. The
// connected accounts page is one, so it keeps a nonce every other path drops.
const GOOGLE_PATHS = ["/login", "/register", "/app/settings/connected-accounts"];

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
 * Clears the single-use sign-in credentials a session has made pointless: the
 * Google nonce, and a challenge whose sign-in ended some other way.
 *
 * Only the Google action spends a nonce, so a password login leaves one behind
 * until it expires. Proxy mints it, so Proxy is where it gets cleaned up.
 *
 * @returns The same response, for use at a return site.
 */
function dropSpentCredentials(request: NextRequest, response: NextResponse): NextResponse {
  if (request.cookies.has(NONCE_COOKIE_NAME)) response.cookies.delete(NONCE_COOKIE_NAME);
  if (request.cookies.has(CHALLENGE_COOKIE_NAME)) response.cookies.delete(CHALLENGE_COOKIE_NAME);
  return response;
}

/**
 * Reports whether this request ends in a document render, the only kind that
 * can repaint `<html>`.
 *
 * An RSC payload replaces a subtree and leaves the document's own attributes
 * where they are, so reading the theme for one would spend a call on nothing.
 * Next's own `RSC` header never reaches Proxy, so `sec-fetch-dest` is the
 * signal: every browser sends it and an RSC fetch reports `empty`. A client
 * that sends none at all is treated as a document.
 */
function paintsDocument(request: NextRequest): boolean {
  const destination = request.headers.get("sec-fetch-dest");
  return destination === null || destination === "document";
}

/**
 * Reads the saved theme for the theme cache.
 *
 * @returns The saved theme, or null when the read failed, which must cost a
 * colour and never a navigation.
 */
async function freshTheme(accessToken: string): Promise<Theme | null> {
  try {
    return (await fetchPreferences(accessToken)).theme;
  } catch {
    return null;
  }
}

/**
 * Builds the pass-through response for a path a visitor may stay on, and
 * re-reads the cached theme whenever a document is about to be painted.
 *
 * The fresh theme goes onto the request as well as the response, or this very
 * render still paints from the cookie the browser sent and the new scheme
 * arrives a navigation late.
 *
 * @returns One carrying a nonce where a Google widget needs one, and a plain
 * one everywhere else, dropping whatever nonce was left behind.
 */
async function passThrough(request: NextRequest, accessToken: string): Promise<NextResponse> {
  const theme = paintsDocument(request) ? await freshTheme(accessToken) : null;
  if (theme) request.cookies.set(THEME_COOKIE_NAME, theme);

  const response = matches(GOOGLE_PATHS, request.nextUrl.pathname)
    ? await withGoogleNonce(request)
    : dropSpentCredentials(request, NextResponse.next({ request }));

  if (theme) response.cookies.set(THEME_COOKIE_NAME, theme, THEME_COOKIE_OPTIONS);

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
 * Reports whether this request is one that should carry a device id.
 *
 * The marketing page is deliberately excluded: an id minted for an anonymous
 * reader would be a tracking cookie that no sign-in ever asks for.
 */
function needsDeviceId(pathname: string, session: Session | null): boolean {
  return session !== null || matches(AUTH_PATHS, pathname);
}

/**
 * Guards every matched route: redirects anonymous visitors to `/login`,
 * refreshes a near-expiry token pair and persists the rotation, and drops the
 * session when refresh is refused.
 */
async function route(
  request: NextRequest,
  session: Session | null,
  deviceId: string,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!session) {
    // Before the nonce, since a Google path behind the session is not one an
    // anonymous visitor may linger on.
    if (!isPublic(pathname)) {
      const response = redirectToLogin(request);
      // A cookie that exists but no longer unseals would otherwise be resent on
      // every request forever.
      if (request.cookies.has(SESSION_COOKIE_NAME)) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      return response;
    }

    if (matches(GOOGLE_PATHS, pathname)) return withGoogleNonce(request);
    return NextResponse.next();
  }

  // Only the auth screens: every other public page, the marketing page
  // included, stays readable while signed in.
  if (matches(AUTH_PATHS, pathname)) {
    return dropSpentCredentials(
      request,
      NextResponse.redirect(new URL(SIGNED_IN_HOME, request.nextUrl)),
    );
  }

  if (!accessTokenExpiresWithin(session.accessToken)) {
    return passThrough(request, session.accessToken);
  }

  try {
    const refreshed = await refreshTokens(
      session.refreshToken,
      buildDeviceHeaders({
        deviceId,
        userAgent: request.headers.get("user-agent"),
        deviceIp: request.headers.get("cf-connecting-ip"),
      }),
    );
    const rotated: Session = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      userUid: refreshed.userUid || session.userUid,
      name: refreshed.name || session.name,
    };

    const response = await passThrough(request, refreshed.accessToken);
    // Writing this back is not optional: the backend has already revoked the
    // old refresh token, so losing the new one ends the session.
    response.cookies.set(SESSION_COOKIE_NAME, await sealSession(rotated), SESSION_COOKIE_OPTIONS);
    // Rolled on the same beat, so a browser in regular use never ages out of
    // its own device identity and gets listed as a stranger.
    response.cookies.set(DEVICE_COOKIE_NAME, deviceId, DEVICE_COOKIE_OPTIONS);
    return response;
  } catch {
    // Spent, revoked, or refused: there is no recovery from here.
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

/**
 * Runs the auth boundary, and mints the device id the backend binds sessions to.
 *
 * Minting lives here because a cookie can only be written in Proxy, a Route
 * Handler or a Server Action, and the id has to exist before the sign-in that
 * uses it. One mint serves whichever response the boundary produced.
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const existingDeviceId = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
  const deviceId = existingDeviceId || createDeviceId();

  const response = await route(request, session, deviceId);

  if (!existingDeviceId && needsDeviceId(request.nextUrl.pathname, session)) {
    response.cookies.set(DEVICE_COOKIE_NAME, deviceId, DEVICE_COOKIE_OPTIONS);
  }

  return response;
}
