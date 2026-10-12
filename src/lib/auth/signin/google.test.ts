import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { isApiError } from "@/lib/api/errors";
import { signInWithGoogle } from "@/lib/auth/signin/google";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("signInWithGoogle", () => {
  it("sends the credential and the raw nonce, and returns the token pair", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/google`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: true,
          message: null,
          data: { token: "access-1", refreshToken: "refresh-1", uid: "user-uid-1" },
        });
      }),
    );

    const tokens = await signInWithGoogle("google-id-token", "raw-nonce");

    expect(body).toEqual({ idToken: "google-id-token", nonce: "raw-nonce" });
    expect(tokens).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      userUid: "user-uid-1",
    });
  });

  it("tolerates a missing uid", async () => {
    server.use(
      http.post(`${BASE}/api/auth/google`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { token: "access-1", refreshToken: "refresh-1" },
        }),
      ),
    );

    await expect(signInWithGoogle("google-id-token", "raw-nonce")).resolves.toMatchObject({
      userUid: "",
    });
  });

  it("throws when a 2xx carries no refresh token", async () => {
    server.use(
      http.post(`${BASE}/api/auth/google`, () =>
        HttpResponse.json({ success: true, message: null, data: { token: "access-1" } }),
      ),
    );

    await expect(signInWithGoogle("google-id-token", "raw-nonce")).rejects.toThrow(
      /no token pair/i,
    );
  });

  it("surfaces a rejected token as an ApiError", async () => {
    server.use(
      http.post(`${BASE}/api/auth/google`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid Google token", data: null },
          { status: 401 },
        ),
      ),
    );

    const error = await signInWithGoogle("stale-token", "raw-nonce").catch(
      (reason: unknown) => reason,
    );

    expect(isApiError(error)).toBe(true);
    expect((error as { status: number; message: string }).status).toBe(401);
    expect((error as { message: string }).message).toBe("Invalid Google token");
  });
});
