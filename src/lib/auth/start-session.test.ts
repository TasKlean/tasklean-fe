import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const setSession = vi.fn(async () => {});

vi.mock("@/lib/auth/session", () => ({
  setSession: (...args: unknown[]) => setSession(...(args as [])),
}));

import { startSession } from "@/lib/auth/start-session";

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

afterEach(() => {
  setSession.mockClear();
});

function profileHandler(body: Record<string, unknown>, status = 200) {
  return http.get(`${BASE}/api/users/me`, () =>
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
});
