import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "session-token",
    refreshToken: "rt-1",
    userUid: "u1",
  }),
}));

import { fetchProfile, getCurrentUser, updateProfile } from "@/lib/users/me/me";

const BASE = "http://api.test";

const PROFILE = {
  uid: "u1",
  email: "ada@lovelace.test",
  name: "Ada",
  lastName: "Lovelace",
  photoUrl: "https://lh3.googleusercontent.com/a/abc",
  isEmailVerified: true,
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function profileHandler(seen: { token?: string | null }) {
  return http.get(`${BASE}/api/users/me`, ({ request }) => {
    seen.token = request.headers.get("authorization");
    return HttpResponse.json({ success: true, message: null, data: PROFILE });
  });
}

describe("fetchProfile", () => {
  it("presents the token it was handed, not the session's", async () => {
    const seen: { token?: string | null } = {};
    server.use(profileHandler(seen));

    await expect(fetchProfile("fresh-token")).resolves.toMatchObject({ name: "Ada" });
    expect(seen.token).toBe("Bearer fresh-token");
  });

  it("unwraps the envelope rather than returning it", async () => {
    server.use(profileHandler({}));

    const profile = await fetchProfile("fresh-token");

    expect(profile.photoUrl).toBe("https://lh3.googleusercontent.com/a/abc");
    expect(profile).not.toHaveProperty("success");
  });

  it("throws the backend's failure through", async () => {
    server.use(
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json({ success: false, message: "Nope" }, { status: 403 }),
      ),
    );

    await expect(fetchProfile("fresh-token")).rejects.toThrow("Nope");
  });
});

describe("getCurrentUser", () => {
  it("uses the session's token", async () => {
    const seen: { token?: string | null } = {};
    server.use(profileHandler(seen));

    await expect(getCurrentUser()).resolves.toMatchObject({ email: "ada@lovelace.test" });
    expect(seen.token).toBe("Bearer session-token");
  });
});

describe("updateProfile", () => {
  it("puts to the subject's own uid, never to /me, which takes no write", async () => {
    const seen: { path?: string; body?: unknown } = {};
    server.use(
      http.put(`${BASE}/api/users/:uid`, async ({ request, params }) => {
        seen.path = String(params.uid);
        seen.body = await request.json();
        return HttpResponse.json({ success: true, message: null, data: PROFILE });
      }),
    );

    await expect(
      updateProfile("u1", { name: "Ada", lastName: "Lovelace", photoUid: "up-1" }),
    ).resolves.toMatchObject({ uid: "u1" });
    expect(seen.path).toBe("u1");
    expect(seen.body).toEqual({ name: "Ada", lastName: "Lovelace", photoUid: "up-1" });
  });

  it("sends no photoUid at all when there is none, which is how one is removed", async () => {
    const seen: { body?: Record<string, unknown> } = {};
    server.use(
      http.put(`${BASE}/api/users/:uid`, async ({ request }) => {
        seen.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, message: null, data: PROFILE });
      }),
    );

    await updateProfile("u1", { name: "Ada", lastName: "Lovelace" });

    expect(Object.keys(seen.body ?? {})).not.toContain("photoUid");
  });

  it("throws the picture refusal through with its code, rather than a generic line", async () => {
    server.use(
      http.put(`${BASE}/api/users/:uid`, () =>
        HttpResponse.json(
          { success: false, message: "Upload not usable", code: "UPLOAD_NOT_USABLE", data: null },
          { status: 400 },
        ),
      ),
    );

    await expect(updateProfile("u1", { name: "Ada", lastName: "Lovelace" })).rejects.toMatchObject({
      code: "UPLOAD_NOT_USABLE",
    });
  });
});
