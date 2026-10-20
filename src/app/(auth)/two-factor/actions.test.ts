import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const { jar } = vi.hoisted(() => ({
  jar: new Map<string, string>([["tasklean_device", "dev-1"]]),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
  headers: async () => new Headers({ "user-agent": "Vitest UA", "x-forwarded-for": "203.0.113.9" }),
}));

import { type TwoFactorState, verifyTwoFactorAction } from "@/app/(auth)/two-factor/actions";
import { SESSION_COOKIE_NAME, unsealSession } from "@/lib/auth/session";
import { CHALLENGE_COOKIE_NAME } from "@/lib/auth/two-factor-challenge";

const BASE = "http://api.test";
const EMPTY: TwoFactorState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  jar.set(CHALLENGE_COOKIE_NAME, "challenge-1");
  server.use(
    http.get(`${BASE}/api/users/me`, () =>
      HttpResponse.json({ success: true, message: null, data: { uid: "u-1", name: "Ada" } }),
    ),
    http.get(`${BASE}/api/user-settings`, () =>
      HttpResponse.json({ success: true, message: null, data: { theme: "SYSTEM", locale: "EN" } }),
    ),
  );
});

afterEach(() => {
  jar.clear();
  jar.set("tasklean_device", "dev-1");
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function verifies(data: Record<string, unknown>, capture?: { body?: unknown; headers?: Headers }) {
  return http.post(`${BASE}/api/auth/2fa/verify`, async ({ request }) => {
    if (capture) {
      capture.headers = request.headers;
      capture.body = await request.json();
    }
    return HttpResponse.json({ success: true, message: null, data });
  });
}

function refuses(status: number, message: string, code?: string, retryAfter?: string) {
  return http.post(`${BASE}/api/auth/2fa/verify`, () =>
    HttpResponse.json(
      { success: false, message, ...(code ? { code } : {}), data: null },
      { status, ...(retryAfter ? { headers: { "Retry-After": retryAfter } } : {}) },
    ),
  );
}

async function redirectOf(state: Promise<TwoFactorState>): Promise<string> {
  const thrown = await state.catch((reason: unknown) => reason);
  return String((thrown as { digest?: string }).digest);
}

const PAIR = { token: "at-1", refreshToken: "rt-1", uid: "u-1", name: "Ada" };

describe("verifyTwoFactorAction validation", () => {
  it("rejects a malformed code without calling the API", async () => {
    const state = await verifyTwoFactorAction(EMPTY, form({ code: "12" }));

    expect(state.fieldErrors?.code).toBe("Enter the 6 digits from your app, or a recovery code.");
    expect(state.error).toBeNull();
  });

  it("sends the code normalised, with the challenge from the cookie", async () => {
    const seen: { body?: unknown } = {};
    server.use(verifies(PAIR, seen));

    await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "bxmb-jva7" })));

    expect(seen.body).toEqual({ challengeToken: "challenge-1", code: "BXMBJVA7" });
  });

  it("never carries the challenge through the form", async () => {
    const seen: { body?: unknown } = {};
    server.use(verifies(PAIR, seen));

    await redirectOf(
      verifyTwoFactorAction(EMPTY, form({ code: "123456", challengeToken: "forged" })),
    );

    expect(seen.body).toMatchObject({ challengeToken: "challenge-1" });
  });
});

describe("verifyTwoFactorAction success", () => {
  it("seals the session and spends the challenge", async () => {
    server.use(verifies(PAIR));

    await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "123456" })));

    const session = await unsealSession(jar.get(SESSION_COOKIE_NAME));
    expect(session?.accessToken).toBe("at-1");
    expect(session?.refreshToken).toBe("rt-1");
    expect(jar.has(CHALLENGE_COOKIE_NAME)).toBe(false);
  });

  it("sends the device headers, since this is where the device row is created", async () => {
    const seen: { headers?: Headers } = {};
    server.use(verifies(PAIR, seen));

    await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "123456" })));

    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Vitest UA");
    expect(seen.headers?.get("x-forwarded-for")).toBe("203.0.113.9");
  });

  it("lands on the app by default", async () => {
    server.use(verifies(PAIR));

    expect(await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "123456" })))).toContain(
      "/app",
    );
  });

  it("returns to where the visitor was headed", async () => {
    server.use(verifies(PAIR));

    const digest = await redirectOf(
      verifyTwoFactorAction(EMPTY, form({ code: "123456", next: "/app/account" })),
    );

    expect(digest).toContain("/app/account");
  });

  it("ignores a next that would leave the site", async () => {
    server.use(verifies(PAIR));

    const digest = await redirectOf(
      verifyTwoFactorAction(EMPTY, form({ code: "123456", next: "https://evil.test" })),
    );

    expect(digest).not.toContain("evil.test");
  });
});

describe("verifyTwoFactorAction failure", () => {
  it("sends a visitor with no challenge back to sign in", async () => {
    jar.delete(CHALLENGE_COOKIE_NAME);

    const digest = await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "123456" })));

    expect(digest).toContain("/login?expired=2fa");
  });

  it("shows a wrong code against the field and keeps the screen", async () => {
    server.use(refuses(401, "That code is not valid.", "TWO_FACTOR_CODE_INVALID"));

    const state = await verifyTwoFactorAction(EMPTY, form({ code: "000000" }));

    expect(state.fieldErrors?.code).toBe("That code is not valid.");
    expect(jar.get(CHALLENGE_COOKIE_NAME)).toBe("challenge-1");
  });

  it("keeps an uncoded 401 on the screen too", async () => {
    server.use(refuses(401, "Nope."));

    const state = await verifyTwoFactorAction(EMPTY, form({ code: "000000" }));

    expect(state.fieldErrors?.code).toBe("Nope.");
  });

  it("drops a dead challenge and starts the sign-in over", async () => {
    server.use(refuses(401, "Too many tries.", "TWO_FACTOR_CHALLENGE_INVALID"));

    const digest = await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "000000" })));

    expect(digest).toContain("/login?expired=2fa");
    expect(jar.has(CHALLENGE_COOKIE_NAME)).toBe(false);
  });

  it("sends a deactivated account to the notice that explains it", async () => {
    server.use(refuses(401, "Account is deactivated.", "ACCOUNT_DEACTIVATED"));

    const digest = await redirectOf(verifyTwoFactorAction(EMPTY, form({ code: "123456" })));

    expect(digest).toContain("/login?deactivated=1");
    expect(jar.has(CHALLENGE_COOKIE_NAME)).toBe(false);
  });

  it("shows the retry window on a 429 and keeps the challenge", async () => {
    server.use(refuses(429, "Too many attempts.", undefined, "120"));

    const state = await verifyTwoFactorAction(EMPTY, form({ code: "123456" }));

    expect(state.error).toBe("Too many attempts. Please try again in 2 minutes.");
    expect(jar.get(CHALLENGE_COOKIE_NAME)).toBe("challenge-1");
  });

  it("surfaces any other failure as its message", async () => {
    server.use(refuses(500, "The server fell over."));

    const state = await verifyTwoFactorAction(EMPTY, form({ code: "123456" }));

    expect(state.error).toBe("The server fell over.");
  });
});
