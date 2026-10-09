import { SignJWT } from "jose";
import { HttpResponse, http } from "msw";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import proxy from "@/proxy";
import { SESSION_COOKIE_NAME, type Session, sealSession, unsealSession } from "@/lib/auth/session";
import { server } from "@/test/msw";

const BASE = "http://api.test";
const SITE = "http://localhost:3000";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "proxy-test-secret-at-least-32-chars";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

async function accessToken(expiresInSeconds: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(new Uint8Array(32));
}

async function sessionCookie(expiresInSeconds: number, refreshToken = "rt-1"): Promise<string> {
  const session: Session = {
    accessToken: await accessToken(expiresInSeconds),
    refreshToken,
    userUid: "u1",
    activeGroupId: 3,
  };
  return sealSession(session);
}

function requestFor(path: string, cookie?: string): NextRequest {
  return new NextRequest(`${SITE}${path}`, {
    headers: cookie ? { cookie: `${SESSION_COOKIE_NAME}=${cookie}` } : {},
  });
}

function refreshHandler(counter: { calls: number }, status = 200) {
  return http.post(`${BASE}/api/auth/refresh`, async () => {
    counter.calls += 1;
    if (status !== 200) {
      return HttpResponse.json({ success: false, message: "Refresh rejected." }, { status });
    }
    return HttpResponse.json({
      success: true,
      data: { token: await accessToken(900), refreshToken: "rt-rotated", uid: "u1" },
    });
  });
}

describe("proxy", () => {
  it("redirects an anonymous visitor away from a protected route, preserving the destination", async () => {
    const response = await proxy(requestFor("/tasks?filter=mine"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/tasks?filter=mine");
  });

  it("lets an anonymous visitor reach a public route", async () => {
    const response = await proxy(requestFor("/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("clears a cookie that no longer unseals", async () => {
    const response = await proxy(requestFor("/tasks", "garbage-not-a-jwe"));

    expect(response.status).toBe(307);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
  });

  it("passes a signed-in request through without refreshing a healthy token", async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    const response = await proxy(requestFor("/tasks", await sessionCookie(3600)));

    expect(response.status).toBe(200);
    expect(counter.calls).toBe(0);
    expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });

  it("refreshes a near-expiry token and persists the rotated pair", async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    const response = await proxy(requestFor("/tasks", await sessionCookie(10, "rt-rotating")));

    expect(response.status).toBe(200);
    expect(counter.calls).toBe(1);

    const written = response.cookies.get(SESSION_COOKIE_NAME)?.value;
    expect(written).toBeTruthy();

    // The rotated refresh token must reach the cookie — losing it kills the
    // session, since the backend has already revoked the old one.
    const rotated = await unsealSession(written);
    expect(rotated?.refreshToken).toBe("rt-rotated");
    expect(rotated?.activeGroupId).toBe(3);
  });

  it("drops the session when refresh is refused", async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter, 401));

    const response = await proxy(requestFor("/tasks", await sessionCookie(10, "rt-dead")));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
  });

  it("sends a signed-in user away from the auth screens", async () => {
    const response = await proxy(requestFor("/login", await sessionCookie(3600)));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/");
  });
});
