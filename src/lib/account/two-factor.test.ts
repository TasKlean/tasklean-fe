import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

import { getTwoFactorStatus } from "@/lib/account/two-factor";
import { isSessionExpiredError } from "@/lib/api/server";

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
