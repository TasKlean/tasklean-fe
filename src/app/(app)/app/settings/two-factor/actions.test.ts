import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const setSession = vi.fn(async () => {});
const revalidatePath = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  setSession: (...args: unknown[]) => setSession(...(args as [])),
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const jar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

import {
  type ConfirmState,
  disableAction,
  enableAction,
  type EnableState,
  regenerateCodesAction,
  type SetupState,
  startSetupAction,
} from "@/app/(app)/app/settings/two-factor/actions";

const BASE = "http://api.test";

const NO_SETUP: SetupState = { error: null };

const NO_ENABLE: EnableState = { error: null };

const NOTHING: ConfirmState = { error: null };

const ENROLLMENT = {
  secret: "JBSWY3DPEHPK3PXP",
  otpauthUri: "otpauth://totp/TasKlean:a@b.c?secret=JBSWY3DPEHPK3PXP",
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  jar.clear();
  jar.set("tasklean_device", "dev-1");
  server.use(
    http.get(`${BASE}/api/users/me`, () =>
      HttpResponse.json({ success: true, message: null, data: { uid: "u1", name: "Bob" } }),
    ),
    http.get(`${BASE}/api/user-settings`, () =>
      HttpResponse.json({ success: true, message: null, data: { theme: "SYSTEM", locale: "EN" } }),
    ),
  );
});

afterEach(() => {
  setSession.mockClear();
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function answers(path: string, data: unknown, status = 200, message: string | null = null) {
  return http.post(`${BASE}/api/account/2fa/${path}`, () =>
    HttpResponse.json({ success: status === 200, message, data }, { status }),
  );
}

function refuses(path: string, code: string, message: string) {
  return http.post(`${BASE}/api/account/2fa/${path}`, () =>
    HttpResponse.json({ success: false, message, code, data: null }, { status: 401 }),
  );
}

function records(path: string, data: unknown, seen: { body?: unknown }) {
  return http.post(`${BASE}/api/account/2fa/${path}`, async ({ request }) => {
    seen.body = await request.json().catch(() => undefined);
    return HttpResponse.json({ success: true, message: null, data }, { status: 200 });
  });
}

describe("startSetupAction", () => {
  it("hands back the secret and a QR code drawn from the URI", async () => {
    server.use(answers("setup", ENROLLMENT));

    const state = await startSetupAction(NO_SETUP, form({ password: "Chores12!" }));

    expect(state.error).toBeNull();
    expect(state.enrollment?.secret).toBe(ENROLLMENT.secret);
    expect(state.enrollment?.otpauthUri).toBe(ENROLLMENT.otpauthUri);
    expect(state.enrollment?.qr.size).toBeGreaterThan(20);
    expect(state.enrollment?.qr.path).toContain("M");
  });

  it("shows a refused password against its own field, and keeps the session", async () => {
    server.use(answers("setup", null, 401, "Current password is incorrect"));

    await expect(startSetupAction(NO_SETUP, form({ password: "wrong" }))).resolves.toEqual({
      error: null,
      fieldErrors: { password: "Current password is incorrect" },
    });
  });

  it("marks the page stale when the backend says it is already on", async () => {
    server.use(answers("setup", null, 409, "Two-factor authentication is already on."));

    const state = await startSetupAction(NO_SETUP, form({}));

    expect(state.error).toBe("Two-factor authentication is already on.");
    expect(revalidatePath).toHaveBeenCalledWith("/app/settings/two-factor");
  });

  it("leaves the page alone for a failure that says nothing about its state", async () => {
    server.use(answers("setup", null, 500, "Nope."));

    const state = await startSetupAction(NO_SETUP, form({ password: "Chores12!" }));

    expect(state.error).toBe("Nope.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a response that cannot be enrolled as a failure, not as a setup", async () => {
    server.use(answers("setup", { secret: "JBSWY3DPEHPK3PXP" }));

    const state = await startSetupAction(NO_SETUP, form({}));

    expect(state.enrollment).toBeUndefined();
    expect(state.error).toBe("Something went wrong. Please try again.");
  });
});

describe("enableAction", () => {
  it("seals the fresh pair, since enabling revoked the one we held", async () => {
    server.use(
      answers("enable", { recoveryCodes: ["abcd-2345"], token: "at-2", refreshToken: "rt-2" }),
    );

    const state = await enableAction(NO_ENABLE, form({ code: "123456" }));

    expect(state).toEqual({ error: null, done: true, recoveryCodes: ["abcd-2345"] });
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "at-2", refreshToken: "rt-2" }),
    );
  });

  it("keeps the codes out of the cache, so nothing re-renders them away", async () => {
    server.use(
      answers("enable", { recoveryCodes: ["abcd-2345"], token: "at-2", refreshToken: "rt-2" }),
    );

    await enableAction(NO_ENABLE, form({ code: "123456" }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("fills the uid from the profile, which the enable response never carries", async () => {
    server.use(answers("enable", { token: "at-2", refreshToken: "rt-2" }));

    await enableAction(NO_ENABLE, form({ code: "123456" }));

    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ userUid: "u1" }));
  });

  it("shows a refused code against its own field, and keeps the session", async () => {
    server.use(answers("enable", null, 401, "That code is not valid."));

    await expect(enableAction(NO_ENABLE, form({ code: "000000" }))).resolves.toEqual({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    });
    expect(setSession).not.toHaveBeenCalled();
  });

  it("marks the page stale when there was nothing pending to confirm", async () => {
    server.use(answers("enable", null, 409, "Start two-factor setup before turning it on."));

    const state = await enableAction(NO_ENABLE, form({ code: "123456" }));

    expect(state.error).toBe("Start two-factor setup before turning it on.");
    expect(revalidatePath).toHaveBeenCalledWith("/app/settings/two-factor");
  });

  it("validates the code before it calls anything", async () => {
    await expect(enableAction(NO_ENABLE, form({ code: "12" }))).resolves.toEqual({
      error: null,
      fieldErrors: { code: "Enter all 6 digits." },
    });
  });
});

describe("disableAction", () => {
  it("seals the fresh pair and reports the factor off", async () => {
    server.use(answers("disable", { token: "at-9", refreshToken: "rt-9" }));

    await expect(
      disableAction(NOTHING, form({ password: "Chores12!", code: "123456" })),
    ).resolves.toEqual({ error: null, done: true });
    expect(setSession).toHaveBeenCalledTimes(1);
  });

  it("sends both credentials as the backend wants them", async () => {
    const seen: { body?: unknown } = {};
    server.use(records("disable", { token: "at-9", refreshToken: "rt-9" }, seen));

    await disableAction(NOTHING, form({ password: "Chores12!", code: " aaaa-1111 " }));

    expect(seen.body).toEqual({ password: "Chores12!", code: "AAAA1111" });
  });

  it("sends no password for an account that has none", async () => {
    const seen: { body?: unknown } = {};
    server.use(records("disable", { token: "at-9", refreshToken: "rt-9" }, seen));

    await disableAction(NOTHING, form({ password: "", code: "123456" }));

    expect(seen.body).toEqual({ code: "123456" });
  });

  it("shows a refused password against its own field", async () => {
    server.use(refuses("disable", "PASSWORD_INVALID", "Current password is incorrect"));

    await expect(
      disableAction(NOTHING, form({ password: "wrong", code: "123456" })),
    ).resolves.toEqual({ error: null, fieldErrors: { password: "Current password is incorrect" } });
  });

  it("shows a refused code against the code instead", async () => {
    server.use(refuses("disable", "TWO_FACTOR_CODE_INVALID", "That code is not valid."));

    await expect(
      disableAction(NOTHING, form({ password: "Chores12!", code: "000000" })),
    ).resolves.toEqual({ error: null, fieldErrors: { code: "That code is not valid." } });
  });

  it("keeps the session for either refusal, since neither is about it", async () => {
    server.use(refuses("disable", "PASSWORD_INVALID", "Current password is incorrect"));

    await disableAction(NOTHING, form({ password: "wrong", code: "123456" }));

    expect(setSession).not.toHaveBeenCalled();
  });

  it("refuses a code of the wrong shape before it costs a call", async () => {
    const state = await disableAction(NOTHING, form({ password: "Chores12!", code: "123" }));

    expect(state.fieldErrors?.code).toBe("Enter the 6 digits from your app, or a recovery code.");
    expect(setSession).not.toHaveBeenCalled();
  });

  it("marks the page stale when the backend says there is nothing to turn off", async () => {
    server.use(answers("disable", null, 409, "Two-factor is not on for this account."));

    const state = await disableAction(NOTHING, form({ password: "Chores12!", code: "123456" }));

    expect(state.error).toBe("Two-factor is not on for this account.");
    expect(revalidatePath).toHaveBeenCalledWith("/app/settings/two-factor");
  });
});

describe("regenerateCodesAction", () => {
  it("hands back the new set", async () => {
    server.use(answers("recovery-codes", { recoveryCodes: ["CCCC3333", "DDDD4444"] }));

    await expect(
      regenerateCodesAction(NOTHING, form({ password: "Chores12!", code: "123456" })),
    ).resolves.toEqual({ error: null, done: true, recoveryCodes: ["CCCC3333", "DDDD4444"] });
  });

  it("leaves the page alone, so the codes outlive the call that made them", async () => {
    server.use(answers("recovery-codes", { recoveryCodes: ["CCCC3333"] }));

    await regenerateCodesAction(NOTHING, form({ password: "Chores12!", code: "123456" }));

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it("shows a refused code against the code field", async () => {
    server.use(refuses("recovery-codes", "TWO_FACTOR_CODE_INVALID", "That code is not valid."));

    await expect(
      regenerateCodesAction(NOTHING, form({ password: "Chores12!", code: "000000" })),
    ).resolves.toEqual({ error: null, fieldErrors: { code: "That code is not valid." } });
  });

  it("reports an empty set as a failure, not as codes to save", async () => {
    server.use(answers("recovery-codes", { recoveryCodes: [] }));

    const state = await regenerateCodesAction(
      NOTHING,
      form({ password: "Chores12!", code: "123456" }),
    );

    expect(state.recoveryCodes).toBeUndefined();
    expect(state.error).toBe("Something went wrong. Please try again.");
  });

  it("marks the page stale when the backend says there is no factor", async () => {
    server.use(answers("recovery-codes", null, 409, "Two-factor is not on for this account."));

    const state = await regenerateCodesAction(
      NOTHING,
      form({ password: "Chores12!", code: "123456" }),
    );

    expect(revalidatePath).toHaveBeenCalledWith("/app/settings/two-factor");
    expect(state.error).toBe("Two-factor is not on for this account.");
  });
});
