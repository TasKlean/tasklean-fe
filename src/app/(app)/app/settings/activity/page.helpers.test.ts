import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import { loadAccountTrail } from "@/app/(app)/app/settings/activity/page.helpers";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const BASE = "http://api.test";
const ACCOUNT = `${BASE}/api/audit-logs/account`;
const ZONE = "Europe/Ljubljana";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function filter(fields: Partial<AuditFilter> = {}): AuditFilter {
  return { type: null, ref: "", actor: "", from: "", to: "", ...fields };
}

function refused(status: number, message: string) {
  return http.get(ACCOUNT, () =>
    HttpResponse.json({ success: false, message, data: null }, { status }),
  );
}

describe("loadAccountTrail", () => {
  it("reads the range as instants in the reader's own zone", async () => {
    let params = new URLSearchParams();
    server.use(
      http.get(ACCOUNT, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({
          success: true,
          message: null,
          data: { items: [{ uid: "a1" }], nextCursor: null, total: 1 },
        });
      }),
    );

    const view = await loadAccountTrail(filter({ from: "2026-11-02", to: "2026-11-09" }), ZONE);

    expect(view.failure).toBeNull();
    expect(view.page.entries).toEqual([{ uid: "a1" }]);
    expect(params.get("dateFrom")).toBe("2026-11-01T23:00:00.000Z");
    expect(params.get("dateTo")).toBe("2026-11-09T23:00:00.000Z");
  });

  it("sends a reader whose session has gone back to the login screen", async () => {
    server.use(refused(401, "Unauthorized"));

    await expect(loadAccountTrail(filter(), ZONE)).rejects.toThrow("REDIRECT:/login");
  });

  it("reports a refusal in the feed's place, since there is no group to be bounced out of", async () => {
    server.use(refused(403, "Forbidden"));

    const view = await loadAccountTrail(filter(), ZONE);

    expect(view.failure).toBe("Forbidden");
    expect(view.page).toEqual({ entries: [], nextCursor: null, total: 0 });
  });
});
