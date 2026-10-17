import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";
import { ApiError } from "@/lib/api/errors";
import { SessionExpiredError } from "@/lib/api/server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

import {
  changePassword,
  deactivateAccount,
  getConnectedAccounts,
  linkGoogle,
  setPassword,
  unlinkGoogle,
} from "@/lib/account/account";

const BASE = "http://api.test";

const PAIR = { token: "at-2", refreshToken: "rt-2", uid: "u1", name: "Bob" };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

type Seen = { headers?: Headers; body?: unknown; method?: string };

function record(method: "post" | "delete", path: string, data: unknown, seen: Seen, status = 200) {
  return http[method](`${BASE}${path}`, async ({ request }) => {
    seen.headers = request.headers;
    seen.method = request.method;
    seen.body = await request.json().catch(() => undefined);
    return HttpResponse.json({ success: status === 200, message: null, data }, { status });
  });
}

describe("getConnectedAccounts", () => {
  it("returns the two flags the backend reports", async () => {
    server.use(
      http.get(`${BASE}/api/account/connected-accounts`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { passwordSet: true, googleLinked: false },
        }),
      ),
    );

    await expect(getConnectedAccounts()).resolves.toEqual({
      passwordSet: true,
      googleLinked: false,
    });
  });
});

describe("changePassword", () => {
  it("sends the device id, without which the rotation lands on a new device", async () => {
    const seen: Seen = {};
    server.use(record("post", "/api/account/change-password", PAIR, seen));

    await changePassword("Old-Pass1!", "New-Pass1!");

    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Vitest UA");
    expect(seen.body).toEqual({ currentPassword: "Old-Pass1!", newPassword: "New-Pass1!" });
  });

  it("returns the rotated pair, which replaces the one in the cookie", async () => {
    server.use(record("post", "/api/account/change-password", PAIR, {}));

    await expect(changePassword("Old-Pass1!", "New-Pass1!")).resolves.toEqual({
      accessToken: "at-2",
      refreshToken: "rt-2",
      userUid: "u1",
      name: "Bob",
    });
  });

  it("reports a wrong current password as an ApiError, not an expired session", async () => {
    server.use(
      http.post(`${BASE}/api/account/change-password`, () =>
        HttpResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 401 },
        ),
      ),
    );

    const error = await changePassword("Wrong-Pass1!", "New-Pass1!").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(SessionExpiredError);
    expect((error as ApiError).message).toBe("Current password is incorrect");
  });

  it("throws when a 2xx carries no new pair", async () => {
    server.use(record("post", "/api/account/change-password", { token: "at-2" }, {}));

    await expect(changePassword("Old-Pass1!", "New-Pass1!")).rejects.toThrow(/no new token pair/);
  });
});

describe("setPassword", () => {
  it("posts only the new password", async () => {
    const seen: Seen = {};
    server.use(record("post", "/api/account/set-password", PAIR, seen));

    await setPassword("New-Pass1!");

    expect(seen.body).toEqual({ newPassword: "New-Pass1!" });
  });
});

describe("linkGoogle", () => {
  it("posts the credential and the raw nonce", async () => {
    const seen: Seen = {};
    server.use(
      record(
        "post",
        "/api/account/connected-accounts/google",
        { passwordSet: true, googleLinked: true },
        seen,
      ),
    );

    await expect(linkGoogle("id-token", "raw-nonce")).resolves.toEqual({
      passwordSet: true,
      googleLinked: true,
    });
    expect(seen.body).toEqual({ idToken: "id-token", nonce: "raw-nonce" });
  });

  it("reports a refused token as an ApiError, not an expired session", async () => {
    server.use(
      http.post(`${BASE}/api/account/connected-accounts/google`, () =>
        HttpResponse.json({ success: false, message: "Invalid Google token" }, { status: 401 }),
      ),
    );

    const error = await linkGoogle("id-token", "raw-nonce").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(SessionExpiredError);
  });
});

describe("unlinkGoogle", () => {
  it("deletes, and surfaces the lockout refusal", async () => {
    const seen: Seen = {};
    server.use(record("delete", "/api/account/connected-accounts/google", null, seen, 409));

    const error = await unlinkGoogle().catch((e: unknown) => e);

    expect(seen.method).toBe("DELETE");
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
  });
});

describe("deactivateAccount", () => {
  it("sends the confirming password", async () => {
    const seen: Seen = {};
    server.use(record("post", "/api/account/deactivate", null, seen));

    await deactivateAccount("Old-Pass1!");

    expect(seen.body).toEqual({ password: "Old-Pass1!" });
  });

  it("sends an empty body for a Google-only account", async () => {
    const seen: Seen = {};
    server.use(record("post", "/api/account/deactivate", null, seen));

    await deactivateAccount();

    expect(seen.body).toEqual({});
  });
});
