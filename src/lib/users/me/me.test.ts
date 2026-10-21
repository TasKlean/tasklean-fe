import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "session-token",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

import { fetchProfile, getCurrentUser } from "@/lib/users/me/me";

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
