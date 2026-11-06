import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

import { loadActivityPageAction } from "@/app/(app)/app/groups/[uid]/overview/activity/actions/actions";

const BASE = "http://api.test";
const FEED = `${BASE}/api/audit-logs/groups/:groupUid`;

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("loadActivityPageAction", () => {
  it("asks for the page after the cursor it was given", async () => {
    let cursor: unknown = null;
    server.use(
      http.get(FEED, ({ request }) => {
        cursor = new URL(request.url).searchParams.get("cursor");
        return HttpResponse.json({
          success: true,
          message: null,
          data: { items: [{ uid: "a2" }], nextCursor: "c2", total: 40 },
        });
      }),
    );

    const result = await loadActivityPageAction({ groupUid: "g1", cursor: "c1" });

    expect(cursor).toBe("c1");
    expect(result).toEqual({
      ok: true,
      page: { entries: [{ uid: "a2" }], nextCursor: "c2", total: 40 },
    });
  });

  it("tells the reader to reload rather than silently restarting a refused cursor", async () => {
    server.use(
      http.get(FEED, () =>
        HttpResponse.json(
          {
            success: false,
            message: "The page cursor is not valid",
            code: "PAGE_CURSOR_INVALID",
            data: null,
          },
          { status: 400 },
        ),
      ),
    );

    const result = await loadActivityPageAction({ groupUid: "g1", cursor: "bad" });

    expect(result).toEqual({ ok: false, message: expect.stringContaining("Reload the page") });
  });

  it("refuses a press carrying no group, since an action never sees the route", async () => {
    const result = await loadActivityPageAction({ cursor: "c1" });

    expect(result.ok).toBe(false);
  });
});
