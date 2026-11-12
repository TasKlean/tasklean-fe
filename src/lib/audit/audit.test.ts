import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
  }),
}));

import { getGroupActivity } from "@/lib/audit/audit";
import { isApiError } from "@/lib/api/errors";

const BASE = "http://api.test";
const TRAIL = `${BASE}/api/audit-logs/groups/:groupUid`;

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

type Seen = { url?: string };

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

function page(data: unknown, seen: Seen) {
  return http.get(TRAIL, ({ request }) => {
    seen.url = request.url;
    return envelope(data);
  });
}

function sent(seen: Seen): URLSearchParams {
  return new URL(seen.url ?? "").searchParams;
}

describe("getGroupActivity", () => {
  it("asks for the default page size when no size was requested", async () => {
    const seen: Seen = {};
    server.use(page({ items: [], nextCursor: null, total: 0 }, seen));

    await getGroupActivity("g1");

    expect(sent(seen).get("limit")).toBe("20");
    expect(sent(seen).get("cursor")).toBeNull();
    expect(sent(seen).get("entityType")).toBeNull();
  });

  it("sends the filter and the cursor it was given", async () => {
    const seen: Seen = {};
    server.use(page({ items: [], nextCursor: null, total: 0 }, seen));

    await getGroupActivity("g1", {
      entityType: "GROUP_MEMBER",
      entityRef: "m7",
      cursor: "cur-1",
      limit: 50,
    });

    expect(sent(seen).get("entityType")).toBe("GROUP_MEMBER");
    expect(sent(seen).get("entityRef")).toBe("m7");
    expect(sent(seen).get("cursor")).toBe("cur-1");
    expect(sent(seen).get("limit")).toBe("50");
  });

  it("encodes a uid that arrived from the URL", async () => {
    const seen: Seen = {};
    server.use(page({ items: [], nextCursor: null, total: 0 }, seen));

    await getGroupActivity("a b/c");

    expect(new URL(seen.url ?? "").pathname).toBe("/api/audit-logs/groups/a%20b%2Fc");
  });

  it("reads a page the envelope answered with nothing in as an empty one", async () => {
    const seen: Seen = {};
    server.use(page({}, seen));

    await expect(getGroupActivity("g1")).resolves.toEqual({
      entries: [],
      nextCursor: null,
      total: 0,
    });
  });

  it("keeps the cursor and the total it was answered with", async () => {
    const seen: Seen = {};
    server.use(page({ items: [{ uid: "a1" }], nextCursor: "cur-2", total: 48 }, seen));

    const result = await getGroupActivity("g1");

    expect(result.nextCursor).toBe("cur-2");
    expect(result.total).toBe(48);
    expect(result.entries).toHaveLength(1);
  });

  it("carries the cursor code through, so a stale one can be recovered from", async () => {
    server.use(
      http.get(TRAIL, () =>
        HttpResponse.json(
          {
            success: false,
            message: "The page cursor is not valid",
            code: "PAGE_CURSOR_INVALID",
          },
          { status: 400 },
        ),
      ),
    );

    await expect(getGroupActivity("g1", { cursor: "nonsense" })).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.code === "PAGE_CURSOR_INVALID",
    );
  });

  it("leaves a group that is not the caller's as a 403 for the screen to bounce on", async () => {
    server.use(
      http.get(TRAIL, () =>
        HttpResponse.json({ success: false, message: "Access denied" }, { status: 403 }),
      ),
    );

    await expect(getGroupActivity("g1")).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.status === 403,
    );
  });
});
