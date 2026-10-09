import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { resendVerification, verifyEmail } from "@/lib/auth/signin/verify-email";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("verifyEmail", () => {
  it("returns the token pair the backend withheld at register", async () => {
    server.use(
      http.post(`${BASE}/api/auth/verify-email`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { token: "access-1", refreshToken: "refresh-1", uid: "user-abc" },
        }),
      ),
    );

    await expect(verifyEmail("a@b.test", "123456")).resolves.toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      userUid: "user-abc",
    });
  });

  it("posts the email and code", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/verify-email`, async ({ request: req }) => {
        body = await req.json();
        return HttpResponse.json({
          success: true,
          message: null,
          data: { token: "t", refreshToken: "r", uid: "u" },
        });
      }),
    );

    await verifyEmail("a@b.test", "123456");
    expect(body).toEqual({ email: "a@b.test", code: "123456" });
  });

  it("surfaces the backend's single generic failure message", async () => {
    server.use(
      http.post(`${BASE}/api/auth/verify-email`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid email or code", data: null },
          { status: 401 },
        ),
      ),
    );

    await expect(verifyEmail("a@b.test", "999999")).rejects.toThrow("Invalid email or code");
  });

  it("rejects a 2xx without a token pair", async () => {
    server.use(
      http.post(`${BASE}/api/auth/verify-email`, () =>
        HttpResponse.json({ success: true, message: null, data: { uid: "u" } }),
      ),
    );

    await expect(verifyEmail("a@b.test", "123456")).rejects.toThrow("returned no token pair");
  });
});

describe("resendVerification", () => {
  it("resolves for an address the backend will not confirm exists", async () => {
    server.use(
      http.post(`${BASE}/api/auth/resend-verification`, () =>
        HttpResponse.json({
          success: true,
          message: "If that address has an account…",
          data: null,
        }),
      ),
    );

    await expect(resendVerification("nobody@example.com")).resolves.toBeUndefined();
  });

  it("posts only the email", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/resend-verification`, async ({ request: req }) => {
        body = await req.json();
        return HttpResponse.json({ success: true, message: null, data: null });
      }),
    );

    await resendVerification("a@b.test");
    expect(body).toEqual({ email: "a@b.test" });
  });

  it("reports the retry window on a 429", async () => {
    server.use(
      http.post(`${BASE}/api/auth/resend-verification`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts.", data: null },
          { status: 429, headers: { "Retry-After": "60" } },
        ),
      ),
    );

    await expect(resendVerification("a@b.test")).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 60,
    });
  });
});
