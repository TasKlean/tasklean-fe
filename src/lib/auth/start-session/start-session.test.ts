import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const setSession = vi.fn(async () => {});

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }));

vi.mock("@/lib/auth/session/session", () => ({
  setSession: (...args: unknown[]) => setSession(...(args as [])),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
  }),
  headers: async () =>
    new Headers({ "user-agent": "Vitest UA", "cf-connecting-ip": "203.0.113.9" }),
}));

import { startSession } from "@/lib/auth/start-session/start-session";
import { THEME_COOKIE_NAME } from "@/lib/preferences/theme-cookie/theme-cookie";

const BASE = "http://api.test";

const TOKENS = {
  accessToken: "at-1",
  refreshToken: "rt-1",
  userUid: "u1",
  name: "Ada",
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  server.use(preferencesHandler({ theme: "SYSTEM", locale: "EN" }));
});

afterEach(() => {
  setSession.mockClear();
  jar.clear();
});

function profileHandler(body: Record<string, unknown>, status = 200) {
  return http.get(`${BASE}/api/users/me`, () =>
    HttpResponse.json({ success: status === 200, message: null, data: body }, { status }),
  );
}

function preferencesHandler(body: Record<string, unknown>, status = 200) {
  return http.get(`${BASE}/api/user-settings`, () =>
    HttpResponse.json({ success: status === 200, message: null, data: body }, { status }),
  );
}

describe("startSession", () => {
  it("seals the photo the auth response never carried", async () => {
    server.use(
      profileHandler({ name: "Ada", photoUrl: "https://lh3.googleusercontent.com/a/abc" }),
    );

    await startSession(TOKENS);

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "at-1",
        refreshToken: "rt-1",
        activeGroupId: null,
        photoUrl: "https://lh3.googleusercontent.com/a/abc",
      }),
    );
  });

  it("still starts the session when the profile call fails", async () => {
    server.use(profileHandler({}, 500));

    await startSession(TOKENS);

    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "at-1", name: "Ada" }),
    );
  });

  it("leaves the photo out rather than sealing an empty one", async () => {
    server.use(profileHandler({ name: "Ada" }));

    await startSession(TOKENS);

    expect(setSession).toHaveBeenCalledWith(
      expect.not.objectContaining({ photoUrl: expect.anything() }),
    );
  });

  it("falls back to the profile name when the auth response omitted one", async () => {
    server.use(profileHandler({ name: "Grace" }));

    await startSession({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" });

    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ name: "Grace" }));
  });

  it("falls back to the profile uid when the exchange answered with the pair alone", async () => {
    server.use(profileHandler({ uid: "u9", name: "Grace" }));

    await startSession({ accessToken: "at-1", refreshToken: "rt-1" });

    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ userUid: "u9" }));
  });

  it("seals an empty uid rather than failing when neither side carried one", async () => {
    server.use(profileHandler({ name: "Grace" }));

    await startSession({ accessToken: "at-1", refreshToken: "rt-1" });

    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ userUid: "" }));
  });
});

describe("startSession and the theme", () => {
  it("caches the theme the account saved, so the next render paints it", async () => {
    server.use(profileHandler({ name: "Ada" }), preferencesHandler({ theme: "DARK" }));

    await startSession(TOKENS);

    expect(jar.get(THEME_COOKIE_NAME)).toBe("DARK");
  });

  it("stops painting the theme of whoever used this browser last", async () => {
    jar.set(THEME_COOKIE_NAME, "DARK");
    server.use(profileHandler({ name: "Ada" }), preferencesHandler({}, 500));

    await startSession(TOKENS);

    expect(jar.get(THEME_COOKIE_NAME)).toBe("SYSTEM");
  });
});

describe("startSession device attribution", () => {
  it("attributes both sign-in reads to the end user", async () => {
    const seen: Headers[] = [];
    server.use(
      http.get(`${BASE}/api/users/me`, ({ request }) => {
        seen.push(request.headers);
        return HttpResponse.json({ success: true, data: { uid: "u1" } });
      }),
      http.get(`${BASE}/api/user-settings`, ({ request }) => {
        seen.push(request.headers);
        return HttpResponse.json({ success: true, data: { theme: "DARK", locale: "EN" } });
      }),
    );

    await startSession(TOKENS);

    expect(seen).toHaveLength(2);
    for (const headers of seen) {
      expect(headers.get("x-device-ip")).toBe("203.0.113.9");
      expect(headers.get("x-internal-hop")).toBeTruthy();
    }
  });
});
