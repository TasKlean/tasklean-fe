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

import { completeTask, getTaskHistory, ROUND_PAGE_SIZE } from "@/lib/tasks/completions/completions";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("completeTask", () => {
  it("posts nothing at all for the one-press round", async () => {
    let sent: unknown = "never read";

    server.use(
      http.post(`${BASE}/api/tasks/t1/complete`, async ({ request }) => {
        sent = await request.json();

        return HttpResponse.json({ success: true, message: "ok", data: { id: 7 } });
      }),
    );

    const recorded = await completeTask("t1");

    expect(sent).toEqual({});
    expect(recorded.id).toBe(7);
  });
});

describe("getTaskHistory", () => {
  it("asks for one page of rounds and narrows the envelope to it", async () => {
    const seen: { url?: URL } = {};

    server.use(
      http.get(`${BASE}/api/tasks/t1/completions`, ({ request }) => {
        seen.url = new URL(request.url);

        return HttpResponse.json({
          success: true,
          message: "ok",
          data: { items: [{ id: 3 }], nextCursor: "c2", total: 12 },
        });
      }),
    );

    const page = await getTaskHistory("t1", "c1");

    expect(seen.url?.searchParams.get("cursor")).toBe("c1");
    expect(seen.url?.searchParams.get("limit")).toBe(String(ROUND_PAGE_SIZE));
    expect(page).toEqual({ rounds: [{ id: 3 }], nextCursor: "c2", total: 12 });
  });

  it("reads a page carrying nothing as an empty history, not a failure", async () => {
    server.use(
      http.get(`${BASE}/api/tasks/t1/completions`, () =>
        HttpResponse.json({ success: true, message: "ok", data: {} }),
      ),
    );

    expect(await getTaskHistory("t1")).toEqual({ rounds: [], nextCursor: null, total: 0 });
  });

  it("sends no cursor for the first page", async () => {
    const seen: { url?: URL } = {};

    server.use(
      http.get(`${BASE}/api/tasks/t1/completions`, ({ request }) => {
        seen.url = new URL(request.url);

        return HttpResponse.json({ success: true, message: "ok", data: { items: [] } });
      }),
    );

    await getTaskHistory("t1");

    expect(seen.url?.searchParams.has("cursor")).toBe(false);
  });
});
