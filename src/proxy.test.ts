import { SignJWT } from "jose";
import { HttpResponse, http } from "msw";
import { NextRequest } from "next/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import proxy from "@/proxy";
import { DEVICE_COOKIE_NAME } from "@/lib/auth/device/device";
import {
  NONCE_COOKIE_NAME,
  NONCE_HEADER_NAME,
  hashNonce,
} from "@/lib/auth/google-nonce/google-nonce";
import { CHALLENGE_COOKIE_NAME } from "@/lib/auth/two-factor-challenge/two-factor-challenge";
import { THEME_COOKIE_NAME } from "@/lib/preferences/theme-cookie/theme-cookie";
import {
  SESSION_COOKIE_NAME,
  type Session,
  sealSession,
  unsealSession,
} from "@/lib/auth/session/session";
import { server } from "@/test/msw";

const BASE = "http://api.test";
const SITE = "http://localhost:3000";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "proxy-test-secret-at-least-32-chars";
  process.env.BFF_HOP_SECRET = "proxy-test-hop-secret-at-least-32-chars";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

function settingsHandler(counter: { calls: number }, theme = "DARK", status = 200) {
  return http.get(`${BASE}/api/user-settings`, () => {
    counter.calls += 1;
    if (status !== 200) {
      return HttpResponse.json({ success: false, message: "No settings." }, { status });
    }
    return HttpResponse.json({ success: true, data: { theme, locale: "EN" } });
  });
}

beforeEach(() => {
  server.use(settingsHandler({ calls: 0 }));
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

function requestWithNonce(path: string, nonce: string, session?: string): NextRequest {
  const cookie = session
    ? `${NONCE_COOKIE_NAME}=${nonce}; ${SESSION_COOKIE_NAME}=${session}`
    : `${NONCE_COOKIE_NAME}=${nonce}`;
  return new NextRequest(`${SITE}${path}`, { headers: { cookie } });
}

function clearsNonce(response: Response): boolean {
  const header = response.headers.get("set-cookie") ?? "";
  return header.includes(`${NONCE_COOKIE_NAME}=;`) || header.includes(`${NONCE_COOKIE_NAME}=""`);
}

function forwardedHash(response: Response): string | undefined {
  for (const [name, value] of response.headers.entries()) {
    if (name.endsWith(NONCE_HEADER_NAME)) return value;
  }
  return undefined;
}

function nonceFrom(response: Response): string | undefined {
  return response.headers.get("set-cookie")?.match(new RegExp(`${NONCE_COOKIE_NAME}=([^;]+)`))?.[1];
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
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/app");
  });

  it("lets a signed-in user read the home page instead of redirecting it onto itself", async () => {
    const response = await proxy(requestFor("/", await sessionCookie(3600)));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy password reset paths", () => {
  it("lets an anonymous visitor ask for a reset link", async () => {
    const response = await proxy(requestFor("/forgot-password"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets an anonymous visitor open the emailed link", async () => {
    const response = await proxy(requestFor("/reset-password?token=tok-1"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets a signed-in visitor ask for a link, which the password page offers", async () => {
    const response = await proxy(requestFor("/forgot-password", await sessionCookie(3600)));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets a signed-in visitor finish a reset they started by email", async () => {
    const response = await proxy(
      requestFor("/reset-password?token=tok-1", await sessionCookie(3600)),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("mints no Google nonce for either of them", async () => {
    const forgot = await proxy(requestFor("/forgot-password"));
    const reset = await proxy(requestFor("/reset-password?token=tok-1"));

    expect(nonceFrom(forgot)).toBeUndefined();
    expect(nonceFrom(reset)).toBeUndefined();
  });
});

describe("proxy two-factor prompt", () => {
  it("lets a visitor with a challenge finish signing in", async () => {
    const response = await proxy(requestFor("/two-factor"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends a visitor who already has a session away", async () => {
    const response = await proxy(requestFor("/two-factor", await sessionCookie(3600)));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/app");
  });

  it("mints a device id, which the verify call has to send", async () => {
    const response = await proxy(requestFor("/two-factor"));

    expect(response.cookies.get(DEVICE_COOKIE_NAME)?.value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("mints no Google nonce there", async () => {
    const response = await proxy(requestFor("/two-factor"));

    expect(nonceFrom(response)).toBeUndefined();
  });

  it("clears a challenge whose sign-in ended some other way", async () => {
    const request = new NextRequest(`${SITE}/app`, {
      headers: {
        cookie: `${CHALLENGE_COOKIE_NAME}=challenge-1; ${SESSION_COOKIE_NAME}=${await sessionCookie(3600)}`,
      },
    });

    const response = await proxy(request);

    expect(response.cookies.get(CHALLENGE_COOKIE_NAME)?.value).toBe("");
  });

  it("leaves the challenge alone while the visitor is still signed out", async () => {
    const request = new NextRequest(`${SITE}/two-factor`, {
      headers: { cookie: `${CHALLENGE_COOKIE_NAME}=challenge-1` },
    });

    const response = await proxy(request);

    expect(response.cookies.get(CHALLENGE_COOKIE_NAME)).toBeUndefined();
  });
});

describe("proxy google nonce", () => {
  it("mints one for the login screen", async () => {
    const response = await proxy(requestFor("/login"));

    expect(nonceFrom(response)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("mints one for the register screen", async () => {
    const response = await proxy(requestFor("/register"));

    expect(nonceFrom(response)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps it httpOnly, so page scripts cannot read or forge it", async () => {
    const response = await proxy(requestFor("/login"));

    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("reuses the nonce it already handed out, so a prefetch cannot strand it", async () => {
    const existing = "a".repeat(64);

    const response = await proxy(requestWithNonce("/login", existing));

    expect(nonceFrom(response)).toBeUndefined();
  });

  it("hands the page the hash, never the nonce itself", async () => {
    const existing = "b".repeat(64);

    const response = await proxy(requestWithNonce("/login", existing));

    expect(forwardedHash(response)).toBe(await hashNonce(existing));
    expect(forwardedHash(response)).not.toBe(existing);
  });

  it("hands over the hash of the nonce it just minted", async () => {
    const response = await proxy(requestFor("/login"));

    expect(forwardedHash(response)).toBe(await hashNonce(nonceFrom(response) ?? ""));
  });

  it("leaves the other public screens alone", async () => {
    const response = await proxy(requestFor("/verify-email"));

    expect(response.headers.get("set-cookie") ?? "").not.toContain(NONCE_COOKIE_NAME);
  });

  it("does not leak the header name into a signed-in render", async () => {
    const response = await proxy(requestFor("/", await sessionCookie(3600)));

    expect(JSON.stringify([...response.headers.entries()])).not.toContain(NONCE_HEADER_NAME);
  });
});

describe("proxy nonce cleanup", () => {
  it("clears a leftover nonce once a session exists", async () => {
    const response = await proxy(requestWithNonce("/", "c".repeat(64), await sessionCookie(3600)));

    expect(clearsNonce(response)).toBe(true);
  });

  it("clears it when bouncing a signed-in visitor off the auth screens", async () => {
    const response = await proxy(
      requestWithNonce("/login", "d".repeat(64), await sessionCookie(3600)),
    );

    expect(response.status).toBe(307);
    expect(clearsNonce(response)).toBe(true);
  });

  it("clears it on the response that also rotates the token pair", async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    const response = await proxy(requestWithNonce("/", "e".repeat(64), await sessionCookie(10)));

    expect(counter.calls).toBe(1);
    expect(clearsNonce(response)).toBe(true);
  });

  it("leaves it alone while the visitor is still signed out", async () => {
    const response = await proxy(requestWithNonce("/login", "f".repeat(64)));

    expect(clearsNonce(response)).toBe(false);
  });

  it("writes no nonce cookie when a signed-in visitor carries no nonce", async () => {
    const response = await proxy(requestFor("/", await sessionCookie(3600)));

    expect(response.headers.get("set-cookie") ?? "").not.toContain(NONCE_COOKIE_NAME);
  });
});

describe("proxy google nonce while signed in", () => {
  it("mints one for the security section, where a link needs a credential", async () => {
    const response = await proxy(
      requestFor("/app/settings/connected-accounts", await sessionCookie(3600)),
    );

    const minted = nonceFrom(response);
    expect(minted).toMatch(/^[0-9a-f]{64}$/);
    expect(forwardedHash(response)).toBe(await hashNonce(minted ?? ""));
  });

  it("keeps the one it already handed out there, rather than dropping it", async () => {
    const existing = "a".repeat(64);
    const response = await proxy(
      requestWithNonce("/app/settings/connected-accounts", existing, await sessionCookie(3600)),
    );

    expect(clearsNonce(response)).toBe(false);
    expect(forwardedHash(response)).toBe(await hashNonce(existing));
  });

  it("keeps it on the response that also rotates the token pair", async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));
    const existing = "b".repeat(64);

    const response = await proxy(
      requestWithNonce(
        "/app/settings/connected-accounts",
        existing,
        await sessionCookie(10, "rt-linking"),
      ),
    );

    expect(counter.calls).toBe(1);
    expect(clearsNonce(response)).toBe(false);
    expect(forwardedHash(response)).toBe(await hashNonce(existing));
    expect(response.headers.get("set-cookie") ?? "").toContain(SESSION_COOKIE_NAME);
  });

  it("sends an anonymous visitor to login instead of minting one", async () => {
    const response = await proxy(requestFor("/app/settings/connected-accounts"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(nonceFrom(response)).toBeUndefined();
  });
});

function requestWithDevice(path: string, deviceId?: string, session?: string): NextRequest {
  const cookies = [
    deviceId ? `${DEVICE_COOKIE_NAME}=${deviceId}` : "",
    session ? `${SESSION_COOKIE_NAME}=${session}` : "",
  ].filter(Boolean);

  return new NextRequest(`${SITE}${path}`, {
    headers: {
      ...(cookies.length ? { cookie: cookies.join("; ") } : {}),
      "user-agent": "Mozilla/5.0 (Windows NT 10.0)",
      "cf-connecting-ip": "203.0.113.9",
    },
  });
}

describe("proxy device id", () => {
  it("mints one on an auth screen, where a sign-in can happen", async () => {
    const response = await proxy(requestFor("/login"));

    expect(response.cookies.get(DEVICE_COOKIE_NAME)?.value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("mints one for a signed-in visitor", async () => {
    const response = await proxy(requestFor("/", await sessionCookie(3600)));

    expect(response.cookies.get(DEVICE_COOKIE_NAME)?.value).toBeTruthy();
  });

  it("mints one for an anonymous visitor asking for a reset link", async () => {
    const response = await proxy(requestFor("/forgot-password"));

    expect(response.cookies.get(DEVICE_COOKIE_NAME)?.value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("mints none for an anonymous reader of the public site", async () => {
    const response = await proxy(requestFor("/"));

    expect(response.cookies.get(DEVICE_COOKIE_NAME)).toBeUndefined();
  });

  it("keeps the id a browser already has", async () => {
    const response = await proxy(requestWithDevice("/login", "device-kept"));

    expect(response.cookies.get(DEVICE_COOKIE_NAME)).toBeUndefined();
  });

  it("sends the id and the real browser user agent on refresh", async () => {
    const seen: { headers?: Headers } = {};
    server.use(
      http.post(`${BASE}/api/auth/refresh`, async ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({
          success: true,
          data: { token: await accessToken(900), refreshToken: "rt-rotated", uid: "u1" },
        });
      }),
    );

    await proxy(requestWithDevice("/tasks", "device-9", await sessionCookie(10, "rt-fresh")));

    expect(seen.headers?.get("x-device-id")).toBe("device-9");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Mozilla/5.0 (Windows NT 10.0)");
    expect(seen.headers?.get("x-device-ip")).toBe("203.0.113.9");
    expect(seen.headers?.get("x-internal-hop")).toBe("proxy-test-hop-secret-at-least-32-chars");
  });

  it("vouches for no address when only x-forwarded-for arrived", async () => {
    const seen: { headers?: Headers } = {};
    server.use(
      http.post(`${BASE}/api/auth/refresh`, async ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({
          success: true,
          data: { token: await accessToken(900), refreshToken: "rt-rotated", uid: "u1" },
        });
      }),
    );

    await proxy(
      requestWithHeaders(
        "/tasks",
        { "x-forwarded-for": "1.2.3.4, 172.70.240.123" },
        await sessionCookie(10, "rt-xff"),
      ),
    );

    expect(seen.headers?.get("x-device-ip")).toBeNull();
    expect(seen.headers?.get("x-internal-hop")).toBeNull();
  });
});

describe("proxy device id rolling", () => {
  it("rolls the existing id forward when it rotates the session", async () => {
    const counter = { calls: 0 };
    server.use(refreshHandler(counter));

    const response = await proxy(
      requestWithDevice("/tasks", "device-kept", await sessionCookie(10, "rt-rolling")),
    );

    expect(counter.calls).toBe(1);
    expect(response.cookies.get(DEVICE_COOKIE_NAME)?.value).toBe("device-kept");
  });

  it("does not touch the cookie on a pass-through request", async () => {
    const response = await proxy(
      requestWithDevice("/tasks", "device-kept", await sessionCookie(3600)),
    );

    expect(response.cookies.get(DEVICE_COOKIE_NAME)).toBeUndefined();
  });
});

function requestWithCookies(path: string, jar: Record<string, string>): NextRequest {
  const cookie = Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  return new NextRequest(`${SITE}${path}`, { headers: { cookie } });
}

function requestWithHeaders(
  path: string,
  extra: Record<string, string>,
  session: string,
): NextRequest {
  return new NextRequest(`${SITE}${path}`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${session}`, ...extra },
  });
}

function forwardedCookie(response: Response): string {
  return response.headers.get("x-middleware-request-cookie") ?? "";
}

function setCookie(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}

describe("proxy theme cache", () => {
  it("re-reads the saved theme before painting a document", async () => {
    const counter = { calls: 0 };
    server.use(settingsHandler(counter, "DARK"));

    const response = await proxy(
      requestWithCookies("/app", {
        [SESSION_COOKIE_NAME]: await sessionCookie(3600),
        [THEME_COOKIE_NAME]: "LIGHT",
      }),
    );

    expect(counter.calls).toBe(1);
    expect(setCookie(response)).toContain(`${THEME_COOKIE_NAME}=DARK`);
  });

  it("paints this very render from the fresh theme, not the next one", async () => {
    server.use(settingsHandler({ calls: 0 }, "DARK"));

    const response = await proxy(
      requestWithCookies("/app", {
        [SESSION_COOKIE_NAME]: await sessionCookie(3600),
        [THEME_COOKIE_NAME]: "LIGHT",
      }),
    );

    expect(forwardedCookie(response)).toContain(`${THEME_COOKIE_NAME}=DARK`);
    expect(forwardedCookie(response)).not.toContain("LIGHT");
  });

  it("re-reads it again on the very next document, with no window in the way", async () => {
    const counter = { calls: 0 };
    server.use(settingsHandler(counter, "DARK"));
    const jar = {
      [SESSION_COOKIE_NAME]: await sessionCookie(3600),
      [THEME_COOKIE_NAME]: "LIGHT",
    };

    await proxy(requestWithCookies("/app", jar));
    await proxy(requestWithCookies("/app", jar));

    expect(counter.calls).toBe(2);
  });

  it("spends no read on an RSC payload, which cannot repaint the document", async () => {
    const counter = { calls: 0 };
    server.use(settingsHandler(counter));

    const response = await proxy(
      requestWithHeaders("/app", { "sec-fetch-dest": "empty" }, await sessionCookie(3600)),
    );

    expect(counter.calls).toBe(0);
    expect(setCookie(response)).not.toContain(THEME_COOKIE_NAME);
  });

  it("reads for a real browser navigation", async () => {
    const counter = { calls: 0 };
    server.use(settingsHandler(counter));

    await proxy(
      requestWithHeaders("/app", { "sec-fetch-dest": "document" }, await sessionCookie(3600)),
    );

    expect(counter.calls).toBe(1);
  });

  it("keeps the cached theme when the read fails", async () => {
    const counter = { calls: 0 };
    server.use(settingsHandler(counter, "DARK", 500));

    const response = await proxy(
      requestWithCookies("/app", {
        [SESSION_COOKIE_NAME]: await sessionCookie(3600),
        [THEME_COOKIE_NAME]: "LIGHT",
      }),
    );

    expect(counter.calls).toBe(1);
    expect(forwardedCookie(response)).toContain(`${THEME_COOKIE_NAME}=LIGHT`);
    expect(setCookie(response)).not.toContain(`${THEME_COOKIE_NAME}=DARK`);
  });

  it("re-reads on the response that also rotates the token pair", async () => {
    const refreshes = { calls: 0 };
    const reads = { calls: 0 };
    server.use(refreshHandler(refreshes), settingsHandler(reads, "LIGHT"));

    const response = await proxy(
      requestWithCookies("/app", {
        [SESSION_COOKIE_NAME]: await sessionCookie(10, "rt-theming"),
        [THEME_COOKIE_NAME]: "DARK",
      }),
    );

    expect(refreshes.calls).toBe(1);
    expect(reads.calls).toBe(1);
    expect(setCookie(response)).toContain(`${THEME_COOKIE_NAME}=LIGHT`);
  });

  it("reads nothing for an anonymous visitor, who has no account to follow", async () => {
    const counter = { calls: 0 };
    server.use(settingsHandler(counter));

    const response = await proxy(requestFor("/"));

    expect(counter.calls).toBe(0);
    expect(setCookie(response)).not.toContain(THEME_COOKIE_NAME);
  });
});

describe("proxy device attribution", () => {
  it("attributes the theme read to the end user, not to our server", async () => {
    const seen: { headers?: Headers } = {};
    server.use(
      http.get(`${BASE}/api/user-settings`, ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({ success: true, data: { theme: "DARK", locale: "EN" } });
      }),
    );

    await proxy(requestWithDevice("/app", "device-11", await sessionCookie(3600)));

    expect(seen.headers?.get("x-device-id")).toBe("device-11");
    expect(seen.headers?.get("x-device-ip")).toBe("203.0.113.9");
    expect(seen.headers?.get("x-internal-hop")).toBe("proxy-test-hop-secret-at-least-32-chars");
  });
});
