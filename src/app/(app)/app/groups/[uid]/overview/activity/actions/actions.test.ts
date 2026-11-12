import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => ({ name, value: name === "tasklean_tz" ? "Europe/Ljubljana" : "dev-1" }),
  }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

import { loadActivityPageAction } from "@/app/(app)/app/groups/[uid]/overview/activity/actions/actions";

const BASE = "http://api.test";
const FEED = `${BASE}/api/audit-logs/groups/:groupUid`;
const ROSTER = `${BASE}/api/groups/:groupUid/members`;

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("loadActivityPageAction", () => {
  it("asks for the page after the cursor it was given", async () => {
    let cursor: unknown = null;
    server.use(
      http.get(ROSTER, () => envelope([])),
      http.get(FEED, ({ request }) => {
        cursor = new URL(request.url).searchParams.get("cursor");
        return envelope({ items: [{ uid: "a2" }], nextCursor: "c2", total: 40 });
      }),
    );

    const result = await loadActivityPageAction({ groupUid: "g1", cursor: "c1" });

    expect(cursor).toBe("c1");
    expect(result).toEqual({
      ok: true,
      page: { entries: [{ uid: "a2" }], nextCursor: "c2", total: 40 },
      names: {},
    });
  });

  it("names the members of the page it loads, the ones who have left included", async () => {
    server.use(
      http.get(ROSTER, () =>
        envelope([
          {
            uid: "m1",
            role: "GROUP_ADMIN",
            isActive: true,
            user: { uid: "u1", name: "Alice", lastName: "Johnson" },
          },
          {
            uid: "m9",
            role: "GROUP_MEMBER",
            isActive: false,
            user: { uid: "u9", name: "Dan", lastName: "Novak" },
          },
        ]),
      ),
      http.get(FEED, () =>
        envelope({
          items: [
            {
              uid: "a3",
              action: "MEMBER_REMOVED",
              entity: { type: "GROUP_MEMBER", ref: "m9" },
            },
          ],
          nextCursor: null,
          total: 1,
        }),
      ),
    );

    const result = await loadActivityPageAction({ groupUid: "g1", cursor: "c1" });

    expect(result.ok && result.names).toEqual({
      m1: { name: "Alice Johnson", userUid: "u1" },
      m9: { name: "Dan Novak", userUid: "u9" },
    });
  });

  it("carries the whole filter with the cursor, the range as instants in the reader's zone", async () => {
    const seen: { params?: URLSearchParams } = {};
    server.use(
      http.get(ROSTER, () => envelope([])),
      http.get(FEED, ({ request }) => {
        seen.params = new URL(request.url).searchParams;
        return envelope({ items: [], nextCursor: null, total: 0 });
      }),
    );

    await loadActivityPageAction({
      groupUid: "g1",
      cursor: "c1",
      type: "member",
      ref: "m1",
      actor: "u2",
      from: "2026-11-02",
      to: "2026-11-09",
    });

    expect(seen.params?.get("entityType")).toBe("GROUP_MEMBER");
    expect(seen.params?.get("entityRef")).toBe("m1");
    expect(seen.params?.get("actorRef")).toBe("u2");
    expect(seen.params?.get("dateFrom")).toBe("2026-11-01T23:00:00.000Z");
    expect(seen.params?.get("dateTo")).toBe("2026-11-09T23:00:00.000Z");
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
