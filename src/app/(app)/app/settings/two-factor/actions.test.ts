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
  enableAction,
  type EnableState,
  type SetupState,
  startSetupAction,
} from "@/app/(app)/app/settings/two-factor/actions";

const BASE = "http://api.test";

const NO_SETUP: SetupState = { error: null };

const NO_ENABLE: EnableState = { error: null };

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
