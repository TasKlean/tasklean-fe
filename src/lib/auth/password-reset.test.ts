import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { completePasswordReset, requestPasswordReset } from "@/lib/auth/password-reset";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("requestPasswordReset", () => {
  it("sends the address the link goes to", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: true,
          message: "If that email is registered, a reset link has been sent",
          data: null,
        });
      }),
    );

    await requestPasswordReset("a@b.test");

    expect(body).toEqual({ email: "a@b.test" });
  });

  it("resolves for an address with no account, because the backend says nothing", async () => {
    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, () =>
        HttpResponse.json({
          success: true,
          message: "If that email is registered, a reset link has been sent",
          data: null,
        }),
      ),
    );

    await expect(requestPasswordReset("nobody@b.test")).resolves.toBeUndefined();
  });

  it("surfaces the retry window on a 429", async () => {
    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts.", data: null },
          { status: 429, headers: { "Retry-After": "3600" } },
        ),
      ),
    );

    const error = await requestPasswordReset("a@b.test").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, retryAfterSeconds: 3600 });
  });
});

describe("completePasswordReset", () => {
  it("sends the token and the new password under the backend's field name", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/reset-password`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, message: "Password reset.", data: null });
      }),
    );

    await completePasswordReset("tok-1", "Chores12!");

    expect(body).toEqual({ token: "tok-1", newPassword: "Chores12!" });
  });

  it("throws an ApiError when the token is unknown, spent or expired", async () => {
    server.use(
      http.post(`${BASE}/api/auth/reset-password`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid or expired reset token", data: null },
          { status: 401 },
        ),
      ),
    );

    const error = await completePasswordReset("spent", "Chores12!").catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "Invalid or expired reset token" });
  });
});
