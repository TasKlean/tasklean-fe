import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
  }),
}));

import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
} from "@/lib/account/two-factor/two-factor";
import { isSessionExpiredError } from "@/lib/api/server/server";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function answers(data: unknown, status = 200) {
  return http.get(`${BASE}/api/account/2fa`, () =>
    HttpResponse.json({ success: status === 200, message: null, data }, { status }),
  );
}

type Seen = { headers?: Headers; body?: unknown };

function records(
  path: string,
  data: unknown,
  seen: Seen,
  status = 200,
  message: string | null = null,
) {
  return http.post(`${BASE}/api/account/2fa/${path}`, async ({ request }) => {
    seen.headers = request.headers;
    seen.body = await request.json().catch(() => undefined);
    return HttpResponse.json({ success: status === 200, message, data }, { status });
  });
}

const ENROLLMENT = { secret: "JBSWY3DPEHPK3PXP", otpauthUri: "otpauth://totp/TasKlean:a@b.c" };

describe("getTwoFactorStatus", () => {
  it("reads an enabled factor", async () => {
    server.use(
      answers({
        enabled: true,
        pendingSetup: false,
        confirmedAt: "2026-10-19T08:30:00",
        recoveryCodesRemaining: 7,
      }),
    );

    await expect(getTwoFactorStatus()).resolves.toEqual({
      enabled: true,
      pendingSetup: false,
      confirmedAt: new Date("2026-10-19T08:30:00Z"),
      recoveryCodesRemaining: 7,
    });
  });

  it("reads the unmarked timestamp as UTC, not as local time", async () => {
    server.use(answers({ enabled: true, confirmedAt: "2026-10-19T08:30:00" }));

    const status = await getTwoFactorStatus();

    expect(status.confirmedAt?.toISOString()).toBe("2026-10-19T08:30:00.000Z");
  });

  it("keeps a pending setup apart from an enabled factor", async () => {
    server.use(answers({ enabled: false, pendingSetup: true, confirmedAt: null }));

    await expect(getTwoFactorStatus()).resolves.toMatchObject({
      enabled: false,
      pendingSetup: true,
      confirmedAt: null,
    });
  });

  it("defaults every field the response left out", async () => {
    server.use(answers({}));

    await expect(getTwoFactorStatus()).resolves.toEqual({
      enabled: false,
      pendingSetup: false,
      confirmedAt: null,
      recoveryCodesRemaining: 0,
    });
  });

  it("treats an unreadable count as none left", async () => {
    server.use(answers({ enabled: true, recoveryCodesRemaining: null }));

    await expect(getTwoFactorStatus()).resolves.toMatchObject({ recoveryCodesRemaining: 0 });
  });

  it("ends the session on a 401, since no credential travels with the call", async () => {
    server.use(answers(null, 401));

    const error = await getTwoFactorStatus().catch((reason: unknown) => reason);

    expect(isSessionExpiredError(error)).toBe(true);
  });

  it("surfaces anything else as the backend's message", async () => {
    server.use(
      http.get(`${BASE}/api/account/2fa`, () =>
        HttpResponse.json({ success: false, message: "Nope.", data: null }, { status: 500 }),
      ),
    );

    await expect(getTwoFactorStatus()).rejects.toThrow("Nope.");
  });
});

describe("startTwoFactorSetup", () => {
  it("returns what the authenticator app needs", async () => {
    server.use(records("setup", ENROLLMENT, {}));

    await expect(startTwoFactorSetup("Secret1!")).resolves.toEqual(ENROLLMENT);
  });

  it("sends the password it was given", async () => {
    const seen: Seen = {};
    server.use(records("setup", ENROLLMENT, seen));

    await startTwoFactorSetup("Secret1!");

    expect(seen.body).toEqual({ password: "Secret1!" });
  });

  it("sends nothing for an account with no password to give", async () => {
    const seen: Seen = {};
    server.use(records("setup", ENROLLMENT, seen));

    await startTwoFactorSetup();

    expect(seen.body).toEqual({});
  });

  it("refuses a response with a secret but no URI", async () => {
    server.use(records("setup", { secret: "JBSWY3DPEHPK3PXP" }, {}));

    await expect(startTwoFactorSetup()).rejects.toThrow("returned nothing to enroll");
  });

  it("refuses a response with a URI but no secret", async () => {
    server.use(records("setup", { otpauthUri: "otpauth://totp/x" }, {}));

    await expect(startTwoFactorSetup()).rejects.toThrow("returned nothing to enroll");
  });

  it("treats a 401 as the password being wrong, not the session dying", async () => {
    server.use(records("setup", null, {}, 401, "Current password is incorrect"));

    const error = await startTwoFactorSetup("nope").catch((reason: unknown) => reason);

    expect(isSessionExpiredError(error)).toBe(false);
    expect(error).toHaveProperty("status", 401);
  });

  it("surfaces a 409 as the backend's own message", async () => {
    server.use(records("setup", null, {}, 409, "Two-factor authentication is already on."));

    await expect(startTwoFactorSetup()).rejects.toThrow("already on");
  });
});

describe("enableTwoFactor", () => {
  it("returns the recovery codes and the fresh pair", async () => {
    server.use(
      records(
        "enable",
        { recoveryCodes: ["AAAA1111", "BBBB2222"], token: "at-2", refreshToken: "rt-2" },
        {},
      ),
    );

    await expect(enableTwoFactor("123456")).resolves.toEqual({
      recoveryCodes: ["AAAA1111", "BBBB2222"],
      tokens: { accessToken: "at-2", refreshToken: "rt-2" },
    });
  });

  it("sends the code and the device headers, so the pair stays on this device", async () => {
    const seen: Seen = {};
    server.use(records("enable", { token: "at-2", refreshToken: "rt-2" }, seen));

    await enableTwoFactor("123456");

    expect(seen.body).toEqual({ code: "123456" });
    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Vitest UA");
  });

  it("refuses a response with half a pair, since the old one is already revoked", async () => {
    server.use(records("enable", { recoveryCodes: ["AAAA1111"], token: "at-2" }, {}));

    await expect(enableTwoFactor("123456")).rejects.toThrow("no new token pair");
  });

  it("survives a response with no codes in it, because the factor is on either way", async () => {
    server.use(records("enable", { token: "at-2", refreshToken: "rt-2" }, {}));

    await expect(enableTwoFactor("123456")).resolves.toMatchObject({ recoveryCodes: [] });
  });

  it("drops an entry in the list that is not a code", async () => {
    server.use(
      records(
        "enable",
        { recoveryCodes: ["AAAA1111", null, 7], token: "at-2", refreshToken: "rt-2" },
        {},
      ),
    );

    await expect(enableTwoFactor("123456")).resolves.toMatchObject({
      recoveryCodes: ["AAAA1111"],
    });
  });

  it("treats a 401 as the code being wrong, not the session dying", async () => {
    server.use(records("enable", null, {}, 401, "That code is not valid."));

    const error = await enableTwoFactor("000000").catch((reason: unknown) => reason);

    expect(isSessionExpiredError(error)).toBe(false);
    expect(error).toHaveProperty("status", 401);
  });

  it("surfaces a 409 as the backend's own message", async () => {
    server.use(records("enable", null, {}, 409, "Start two-factor setup before turning it on."));

    await expect(enableTwoFactor("123456")).rejects.toThrow("Start two-factor setup");
  });
});

describe("disableTwoFactor", () => {
  it("returns the fresh pair for this device", async () => {
    server.use(records("disable", { token: "at-3", refreshToken: "rt-3", uid: "u1" }, {}));

    await expect(disableTwoFactor("123456", "pw")).resolves.toEqual({
      accessToken: "at-3",
      refreshToken: "rt-3",
    });
  });

  it("sends both credentials and the device headers, so the pair stays on this device", async () => {
    const seen: Seen = {};
    server.use(records("disable", { token: "at-3", refreshToken: "rt-3" }, seen));

    await disableTwoFactor("123456", "pw");

    expect(seen.body).toEqual({ password: "pw", code: "123456" });
    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Vitest UA");
  });

  it("sends no password for an account that has none", async () => {
    const seen: Seen = {};
    server.use(records("disable", { token: "at-3", refreshToken: "rt-3" }, seen));

    await disableTwoFactor("AAAA1111");

    expect(seen.body).toEqual({ code: "AAAA1111" });
  });

  it("refuses a response with half a pair, since the old one is already revoked", async () => {
    server.use(records("disable", { token: "at-3" }, {}));

    await expect(disableTwoFactor("123456", "pw")).rejects.toThrow("no new token pair");
  });

  it("treats a 401 as the credentials being wrong, not the session dying", async () => {
    server.use(records("disable", null, {}, 401, "That code is not valid."));

    const error = await disableTwoFactor("000000", "pw").catch((reason: unknown) => reason);

    expect(isSessionExpiredError(error)).toBe(false);
    expect(error).toHaveProperty("status", 401);
  });

  it("surfaces a 409 as the backend's own message", async () => {
    server.use(records("disable", null, {}, 409, "Two-factor is not on for this account."));

    await expect(disableTwoFactor("123456", "pw")).rejects.toThrow("Two-factor is not on");
  });
});

describe("regenerateRecoveryCodes", () => {
  it("returns the new set", async () => {
    server.use(records("recovery-codes", { recoveryCodes: ["CCCC3333", "DDDD4444"] }, {}));

    await expect(regenerateRecoveryCodes("123456", "pw")).resolves.toEqual([
      "CCCC3333",
      "DDDD4444",
    ]);
  });

  it("sends both credentials", async () => {
    const seen: Seen = {};
    server.use(records("recovery-codes", { recoveryCodes: ["CCCC3333"] }, seen));

    await regenerateRecoveryCodes("123456", "pw");

    expect(seen.body).toEqual({ password: "pw", code: "123456" });
  });

  it("drops an entry in the list that is not a code", async () => {
    server.use(records("recovery-codes", { recoveryCodes: ["CCCC3333", null, 7] }, {}));

    await expect(regenerateRecoveryCodes("123456", "pw")).resolves.toEqual(["CCCC3333"]);
  });

  it("refuses an empty set, because the codes it replaced are already gone", async () => {
    server.use(records("recovery-codes", { recoveryCodes: [] }, {}));

    await expect(regenerateRecoveryCodes("123456", "pw")).rejects.toThrow("no new ones came back");
  });

  it("treats a 401 as the credentials being wrong, not the session dying", async () => {
    server.use(records("recovery-codes", null, {}, 401, "That code is not valid."));

    const error = await regenerateRecoveryCodes("000000", "pw").catch((reason: unknown) => reason);

    expect(isSessionExpiredError(error)).toBe(false);
    expect(error).toHaveProperty("status", 401);
  });

  it("surfaces a 409 as the backend's own message", async () => {
    server.use(records("recovery-codes", null, {}, 409, "Two-factor is not on for this account."));

    await expect(regenerateRecoveryCodes("123456", "pw")).rejects.toThrow("Two-factor is not on");
  });
});
