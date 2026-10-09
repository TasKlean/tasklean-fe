import { HttpResponse, http } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { SessionExpiredError, serverApi } from "@/lib/api/server";
import type { Session } from "@/lib/auth/session";
import { server } from "@/test/msw";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession }));

const BASE = "http://api.test";

const session: Session = {
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  userUid: "u1",
  activeGroupId: 3,
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "a".repeat(32);
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

beforeEach(() => {
  getSession.mockReset();
});

describe("serverApi", () => {
  it("throws SessionExpiredError when there is no session, without calling the API", async () => {
    getSession.mockResolvedValue(null);
    // No MSW handler registered: a request here would fail the test outright.
    await expect(serverApi("/api/users/me")).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("injects the session's access token as a bearer", async () => {
    getSession.mockResolvedValue(session);
    let seenAuth: string | null = null;

    server.use(
      http.get(`${BASE}/api/users/me`, ({ request: req }) => {
        seenAuth = req.headers.get("Authorization");
        return HttpResponse.json({ success: true, data: { uid: "u1" } });
      }),
    );

    await expect(serverApi<{ uid: string }>("/api/users/me")).resolves.toEqual({ uid: "u1" });
    expect(seenAuth).toBe("Bearer access-token-value");
  });

  it("converts a 401 into SessionExpiredError", async () => {
    getSession.mockResolvedValue(session);
    server.use(
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
      ),
    );

    await expect(serverApi("/api/users/me")).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("lets a 403 through as an ApiError — not a session problem", async () => {
    getSession.mockResolvedValue(session);
    server.use(
      http.get(`${BASE}/api/groups/g1`, () =>
        HttpResponse.json({ success: false, message: "Not a group admin." }, { status: 403 }),
      ),
    );

    const error = await serverApi("/api/groups/g1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(SessionExpiredError);
    expect((error as ApiError).message).toBe("Not a group admin.");
  });

  it("passes query and method through to the client", async () => {
    getSession.mockResolvedValue(session);
    let seenUrl = "";

    server.use(
      http.post(`${BASE}/api/tasks`, ({ request: req }) => {
        seenUrl = req.url;
        return HttpResponse.json({ success: true, data: { uid: "t1" } });
      }),
    );

    await serverApi("/api/tasks", { method: "POST", query: { groupId: 7 }, body: { name: "x" } });
    expect(new URL(seenUrl).searchParams.get("groupId")).toBe("7");
  });
});
