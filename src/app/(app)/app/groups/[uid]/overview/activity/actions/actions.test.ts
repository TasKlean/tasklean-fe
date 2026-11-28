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

import {
  loadActivityPageAction,
  searchTasksAction,
} from "@/app/(app)/app/groups/[uid]/overview/activity/actions/actions";

const BASE = "http://api.test";
const FEED = `${BASE}/api/audit-logs/groups/:groupUid`;
const ROSTER = `${BASE}/api/groups/:groupUid/members`;
const BOARD = `${BASE}/api/groups/:groupUid/tasks`;
const CATEGORIES = `${BASE}/api/groups/:groupUid/categories`;
const TAGS = `${BASE}/api/groups/:groupUid/tags`;

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

// The reads a page's names come from beyond the roster, quiet unless a test is
// about them: an unhandled request fails the test.
function quietReads() {
  return [
    http.get(BOARD, () => envelope({ items: [] })),
    http.get(CATEGORIES, () => envelope([])),
    http.get(TAGS, () => envelope([])),
  ];
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
      ...quietReads(),
      http.get(FEED, ({ request }) => {
        cursor = new URL(request.url).searchParams.get("cursor");
        return envelope({ items: [{ uid: "a2" }], nextCursor: "c2", total: 40 });
      }),
    );

    const result = await loadActivityPageAction("g1", { cursor: "c1" });

    expect(cursor).toBe("c1");
    expect(result).toEqual({
      ok: true,
      page: { entries: [{ uid: "a2" }], nextCursor: "c2", total: 40 },
      names: {},
    });
  });

  it("names what the page it loads is about, the members who have left included", async () => {
    server.use(
      http.get(CATEGORIES, () => envelope([])),
      http.get(TAGS, () => envelope([])),
      http.get(BOARD, () => envelope({ items: [{ uid: "t1", name: "Bins" }] })),
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

    const result = await loadActivityPageAction("g1", { cursor: "c1" });

    expect(result.ok && result.names).toEqual({
      "GROUP_MEMBER:m1": { name: "Alice Johnson", userUid: "u1" },
      "GROUP_MEMBER:m9": { name: "Dan Novak", userUid: "u9" },
      "TASK:t1": { name: "Bins" },
    });
  });

  it("carries the whole filter with the cursor, the range as instants in the reader's zone", async () => {
    const seen: { params?: URLSearchParams } = {};
    server.use(
      http.get(ROSTER, () => envelope([])),
      ...quietReads(),
      http.get(FEED, ({ request }) => {
        seen.params = new URL(request.url).searchParams;
        return envelope({ items: [], nextCursor: null, total: 0 });
      }),
    );

    await loadActivityPageAction("g1", {
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
      http.get(ROSTER, () => envelope([])),
      ...quietReads(),
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

    const result = await loadActivityPageAction("g1", { cursor: "bad" });

    expect(result).toEqual({ ok: false, message: expect.stringContaining("Reload the page") });
  });

  it("reads the group it was bound to, never one the press names", async () => {
    let asked = "";
    server.use(
      http.get(ROSTER, () => envelope([])),
      ...quietReads(),
      http.get(FEED, ({ params }) => {
        asked = String(params.groupUid);
        return envelope({ items: [], nextCursor: null, total: 0 });
      }),
    );

    await loadActivityPageAction("g1", { cursor: "c1", groupUid: "g9" });

    expect(asked).toBe("g1");
  });
});

describe("searchTasksAction", () => {
  it("searches the group it was bound to, never one the press names", async () => {
    let asked = "";
    server.use(
      http.get(BOARD, ({ params, request }) => {
        asked = String(params.groupUid);
        return envelope({
          items: [{ uid: "t1", name: String(new URL(request.url).searchParams.get("q")) }],
        });
      }),
    );

    expect(await searchTasksAction("g1", "bins")).toEqual([{ ref: "t1", name: "bins" }]);
    expect(asked).toBe("g1");
  });

  it("reports a query the backend would refuse rather than answering with no matches", async () => {
    expect(await searchTasksAction("g1", "x".repeat(101))).toBeNull();
  });
});
