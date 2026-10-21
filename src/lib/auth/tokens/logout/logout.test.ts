import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { isApiError } from "@/lib/api/errors";
import { revokeSession } from "@/lib/auth/tokens/logout/logout";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("revokeSession", () => {
  it("sends the refresh token the backend revokes by", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/logout`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, message: "Logged out", data: null });
      }),
    );

    await revokeSession("refresh-1");

    expect(body).toEqual({ refreshToken: "refresh-1" });
  });

  it("throws an ApiError when the token is already spent", async () => {
    server.use(
      http.post(`${BASE}/api/auth/logout`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid refresh token", data: null },
          { status: 401 },
        ),
      ),
    );

    const error = await revokeSession("spent").catch((reason: unknown) => reason);

    expect(isApiError(error)).toBe(true);
  });
});
