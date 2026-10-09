import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { loginWithPassword } from "@/lib/auth/signin/login";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("loginWithPassword", () => {
  it("maps the backend's field names onto ours", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { token: "access-1", refreshToken: "refresh-1", uid: "user-abc" },
        }),
      ),
    );

    await expect(loginWithPassword("a@b.test", "password123")).resolves.toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      userUid: "user-abc",
    });
  });

  it("sends the credentials as the backend expects them", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/login`, async ({ request: req }) => {
        body = await req.json();
        return HttpResponse.json({
          success: true,
          message: null,
          data: { token: "t", refreshToken: "r", uid: "u" },
        });
      }),
    );

    await loginWithPassword("a@b.test", "password123");
    expect(body).toEqual({ email: "a@b.test", password: "password123" });
  });

  it("surfaces the backend's 401 message rather than inventing one", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid email or password", data: null },
          { status: 401 },
        ),
      ),
    );

    await expect(loginWithPassword("a@b.test", "wrong")).rejects.toThrow(ApiError);
    await expect(loginWithPassword("a@b.test", "wrong")).rejects.toThrow(
      "Invalid email or password",
    );
  });

  // Half a pair would produce a session that cannot survive its first expiry.
  it.each([
    ["no refreshToken", { token: "t", uid: "u" }],
    ["no token", { refreshToken: "r", uid: "u" }],
    ["empty payload", {}],
  ])("rejects a 2xx with %s", async (_label, data) => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ success: true, message: null, data }),
      ),
    );

    await expect(loginWithPassword("a@b.test", "password123")).rejects.toThrow(
      "returned no token pair",
    );
  });

  it("tolerates a missing uid, which openapi.json does not mark required", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { token: "t", refreshToken: "r" },
        }),
      ),
    );

    await expect(loginWithPassword("a@b.test", "password123")).resolves.toMatchObject({
      userUid: "",
    });
  });
});
