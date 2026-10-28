import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";
import { SessionExpiredError } from "@/lib/api/server/server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
  }),
}));

import { fetchPreferences, getPreferences, savePreferences } from "@/lib/preferences/preferences";

const BASE = "http://api.test";

const PATH = `${BASE}/api/user-settings`;

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function answer(data: unknown, status = 200) {
  return http.get(PATH, () =>
    HttpResponse.json({ success: status === 200, message: null, data }, { status }),
  );
}

describe("getPreferences", () => {
  it("returns the pair the backend reports", async () => {
    server.use(answer({ theme: "DARK", locale: "SL" }));

    await expect(getPreferences()).resolves.toEqual({ theme: "DARK", locale: "SL" });
  });

  it("falls back to the defaults for values it does not recognise", async () => {
    server.use(answer({ theme: "MIDNIGHT", locale: "fr" }));

    await expect(getPreferences()).resolves.toEqual({ theme: "SYSTEM", locale: "EN" });
  });

  it("falls back to the defaults when the payload carries neither field", async () => {
    server.use(answer({}));

    await expect(getPreferences()).resolves.toEqual({ theme: "SYSTEM", locale: "EN" });
  });

  it("ends the session on a 401", async () => {
    server.use(answer(null, 401));

    await expect(getPreferences()).rejects.toBeInstanceOf(SessionExpiredError);
  });
});

describe("savePreferences", () => {
  it("replaces both fields, because the endpoint takes both", async () => {
    const seen: { method?: string; body?: unknown } = {};
    server.use(
      http.put(PATH, async ({ request }) => {
        seen.method = request.method;
        seen.body = await request.json();
        return HttpResponse.json({ success: true, message: null, data: seen.body });
      }),
    );

    await expect(savePreferences({ theme: "LIGHT", locale: "DE" })).resolves.toEqual({
      theme: "LIGHT",
      locale: "DE",
    });
    expect(seen.method).toBe("PUT");
    expect(seen.body).toEqual({ theme: "LIGHT", locale: "DE" });
  });
});

describe("fetchPreferences", () => {
  it("reads with the token it is given, before a session cookie exists", async () => {
    let authorization: string | null = null;
    server.use(
      http.get(PATH, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({
          success: true,
          message: null,
          data: { theme: "LIGHT", locale: "EN" },
        });
      }),
    );

    await expect(fetchPreferences("at-fresh")).resolves.toEqual({ theme: "LIGHT", locale: "EN" });
    expect(authorization).toBe("Bearer at-fresh");
  });
});
