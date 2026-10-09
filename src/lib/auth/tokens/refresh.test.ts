import { HttpResponse, http } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { RefreshFailedError, refreshTokens } from "@/lib/auth/tokens/refresh";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "a".repeat(32);
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

function handler(counter: { calls: number }, status = 200) {
  return http.post(`${BASE}/api/auth/refresh`, async ({ request: req }) => {
    counter.calls += 1;
    const body = (await req.json()) as { refreshToken: string };

    if (status !== 200) {
      return HttpResponse.json({ success: false, message: "Refresh rejected." }, { status });
    }

    return HttpResponse.json({
      success: true,
      data: { token: `access-for-${body.refreshToken}`, refreshToken: "next-refresh", uid: "u1" },
    });
  });
}

describe("refreshTokens", () => {
  it("maps the backend's field names onto ours", async () => {
    const counter = { calls: 0 };
    server.use(handler(counter));

    await expect(refreshTokens("rt-map")).resolves.toEqual({
      accessToken: "access-for-rt-map",
      refreshToken: "next-refresh",
      userUid: "u1",
    });
  });

  it("single-flights concurrent refreshes of the same token", async () => {
    const counter = { calls: 0 };
    server.use(handler(counter));

    const [a, b, c] = await Promise.all([
      refreshTokens("rt-concurrent"),
      refreshTokens("rt-concurrent"),
      refreshTokens("rt-concurrent"),
    ]);

    expect(counter.calls).toBe(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("serves a straggler from the grace window rather than re-spending the token", async () => {
    const counter = { calls: 0 };
    server.use(handler(counter));

    const first = await refreshTokens("rt-straggler");
    const late = await refreshTokens("rt-straggler");

    expect(counter.calls).toBe(1);
    expect(late).toEqual(first);
  });

  it("refreshes different tokens independently", async () => {
    const counter = { calls: 0 };
    server.use(handler(counter));

    await Promise.all([refreshTokens("rt-one"), refreshTokens("rt-two")]);

    expect(counter.calls).toBe(2);
  });

  it("throws RefreshFailedError carrying the status when the backend rejects", async () => {
    const counter = { calls: 0 };
    server.use(handler(counter, 401));

    const error = await refreshTokens("rt-rejected").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RefreshFailedError);
    expect((error as RefreshFailedError).status).toBe(401);
  });

  it("does not cache a failure, so a later attempt can try again", async () => {
    const counter = { calls: 0 };
    server.use(handler(counter, 500));

    await refreshTokens("rt-retry").catch(() => undefined);
    await refreshTokens("rt-retry").catch(() => undefined);

    expect(counter.calls).toBe(2);
  });

  it("rejects a 2xx that carries no token pair", async () => {
    server.use(
      http.post(`${BASE}/api/auth/refresh`, () =>
        HttpResponse.json({ success: true, data: { uid: "u1" } }),
      ),
    );

    await expect(refreshTokens("rt-empty")).rejects.toBeInstanceOf(RefreshFailedError);
  });
});
