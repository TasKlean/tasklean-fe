import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  isAccountDeactivated,
  isChallengeDead,
  verifyTwoFactor,
} from "@/lib/auth/signin/two-factor/two-factor";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("verifyTwoFactor", () => {
  it("posts the challenge and the code, and maps the pair onto ours", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/2fa/verify`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: true,
          message: null,
          data: { token: "access-1", refreshToken: "refresh-1", uid: "u-1", name: "Ada" },
        });
      }),
    );

    const tokens = await verifyTwoFactor("challenge-1", "123456");

    expect(body).toEqual({ challengeToken: "challenge-1", code: "123456" });
    expect(tokens).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      userUid: "u-1",
      name: "Ada",
    });
  });

  it("carries the device headers, since the device row is created here", async () => {
    const seen: { headers?: Headers } = {};
    server.use(
      http.post(`${BASE}/api/auth/2fa/verify`, ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({
          success: true,
          message: null,
          data: { token: "t", refreshToken: "r", uid: "u" },
        });
      }),
    );

    await verifyTwoFactor("challenge-1", "123456", {
      "X-Device-Id": "dev-1",
      "X-Device-User-Agent": "Vitest UA",
    });

    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Vitest UA");
  });

  it("rejects a 2xx that carries no token pair", async () => {
    server.use(
      http.post(`${BASE}/api/auth/2fa/verify`, () =>
        HttpResponse.json({ success: true, message: null, data: { token: "t" } }),
      ),
    );

    await expect(verifyTwoFactor("challenge-1", "123456")).rejects.toThrow(/no token pair/i);
  });

  it("surfaces a wrong code as an ApiError carrying the message", async () => {
    server.use(
      http.post(`${BASE}/api/auth/2fa/verify`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "That code is not valid.",
            code: "TWO_FACTOR_CODE_INVALID",
            data: null,
          },
          { status: 401 },
        ),
      ),
    );

    const error = await verifyTwoFactor("challenge-1", "000000").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("That code is not valid.");
    expect(isChallengeDead(error)).toBe(false);
  });
});

describe("isChallengeDead", () => {
  it("reads the challenge code", () => {
    expect(isChallengeDead(new ApiError(401, "Gone.", null, "TWO_FACTOR_CHALLENGE_INVALID"))).toBe(
      true,
    );
  });

  it("leaves an uncoded 401 on the screen", () => {
    expect(isChallengeDead(new ApiError(401, "Challenge expired."))).toBe(false);
  });

  it("ignores a wrong code", () => {
    expect(isChallengeDead(new ApiError(401, "Nope.", null, "TWO_FACTOR_CODE_INVALID"))).toBe(
      false,
    );
  });

  it("ignores a status other than 401", () => {
    expect(isChallengeDead(new ApiError(429, "Nope.", null, "TWO_FACTOR_CHALLENGE_INVALID"))).toBe(
      false,
    );
  });

  it("ignores anything that is not an ApiError", () => {
    expect(isChallengeDead(new Error("TWO_FACTOR_CHALLENGE_INVALID"))).toBe(false);
  });
});

describe("isAccountDeactivated", () => {
  it("reads the deactivated code", () => {
    expect(isAccountDeactivated(new ApiError(401, "Gone.", null, "ACCOUNT_DEACTIVATED"))).toBe(
      true,
    );
  });

  it("ignores a wrong code", () => {
    expect(isAccountDeactivated(new ApiError(401, "Nope.", null, "TWO_FACTOR_CODE_INVALID"))).toBe(
      false,
    );
  });
});
