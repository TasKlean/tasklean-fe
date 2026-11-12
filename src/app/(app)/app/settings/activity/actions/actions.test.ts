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

import { loadAccountPageAction } from "@/app/(app)/app/settings/activity/actions/actions";

const BASE = "http://api.test";
const ACCOUNT = `${BASE}/api/audit-logs/account`;

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("loadAccountPageAction", () => {
  it("carries the range with the cursor, so page two covers the days page one did", async () => {
    let params = new URLSearchParams();
    server.use(
      http.get(ACCOUNT, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({
          success: true,
          message: null,
          data: { items: [{ uid: "a2" }], nextCursor: null, total: 2 },
        });
      }),
    );

    const result = await loadAccountPageAction({
      cursor: "c1",
      from: "2026-11-02",
      to: "2026-11-09",
    });

    expect(params.get("cursor")).toBe("c1");
    expect(params.get("dateFrom")).toBe("2026-11-01T23:00:00.000Z");
    expect(params.get("dateTo")).toBe("2026-11-09T23:00:00.000Z");
    expect(result).toEqual({
      ok: true,
      page: { entries: [{ uid: "a2" }], nextCursor: null, total: 2 },
      names: {},
    });
  });

  it("tells the reader to reload rather than silently restarting a refused cursor", async () => {
    server.use(
      http.get(ACCOUNT, () =>
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

    const result = await loadAccountPageAction({ cursor: "bad" });

    expect(result).toEqual({ ok: false, message: expect.stringContaining("Reload the page") });
  });

  it("refuses a day that is not one, rather than asking the endpoint about it", async () => {
    const result = await loadAccountPageAction({ cursor: "c1", from: "last tuesday" });

    expect(result.ok).toBe(false);
  });
});
