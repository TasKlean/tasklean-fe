import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const setSession = vi.fn(async () => {});
const revalidatePath = vi.fn();

vi.mock("@/lib/auth/session/session", () => ({
  setSession: (...args: unknown[]) => setSession(...(args as [])),
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
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
  changePasswordAction,
  type PasswordActionState,
  setPasswordAction,
} from "@/app/(app)/app/settings/password/actions/actions";

const BASE = "http://api.test";
const EMPTY: PasswordActionState = { error: null };
const PAIR = { token: "at-2", refreshToken: "rt-2", uid: "u1", name: "Bob" };

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

const GOOD = form({
  currentPassword: "oldpass",
  newPassword: "Chores12!",
  confirmPassword: "Chores12!",
});

const WITH_CODE = form({
  currentPassword: "oldpass",
  newPassword: "Chores12!",
  confirmPassword: "Chores12!",
  code: "123456",
});

describe("changePasswordAction", () => {
  it("seals the pair the backend hands back, which replaces the revoked one", async () => {
    server.use(
      http.post(`${BASE}/api/account/change-password`, () =>
        HttpResponse.json({ success: true, message: null, data: PAIR }),
      ),
    );

    await expect(changePasswordAction(EMPTY, GOOD)).resolves.toEqual({
      error: null,
      done: "changed",
    });
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "at-2", refreshToken: "rt-2" }),
    );
  });

  it("shows a refused current password against its own field, and keeps the session", async () => {
    server.use(
      http.post(`${BASE}/api/account/change-password`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "Current password is incorrect",
            code: "PASSWORD_INVALID",
          },
          { status: 401 },
        ),
      ),
    );

    await expect(changePasswordAction(EMPTY, GOOD)).resolves.toEqual({
      error: null,
      fieldErrors: { currentPassword: "Current password is incorrect" },
    });
    expect(setSession).not.toHaveBeenCalled();
  });

  it("does not blame the field for a 401 that said nothing about the password", async () => {
    server.use(
      http.post(`${BASE}/api/account/change-password`, () =>
        HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
      ),
    );

    const state = await changePasswordAction(EMPTY, GOOD);

    expect(state.fieldErrors).toBeUndefined();
    expect(state.error).toBe("Unauthorized");
  });

  it("reports what the backend objected to when there is nothing to change", async () => {
    server.use(
      http.post(`${BASE}/api/account/change-password`, () =>
        HttpResponse.json(
          { success: false, message: "This account has no password yet. Set a password instead." },
          { status: 409 },
        ),
      ),
    );

    const state = await changePasswordAction(EMPTY, GOOD);

    expect(state.error).toBe("This account has no password yet. Set a password instead.");
  });

  it("passes a second-factor code on to the backend", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/account/change-password`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, message: null, data: PAIR });
      }),
    );

    await changePasswordAction(EMPTY, WITH_CODE);

    expect(body).toMatchObject({ code: "123456" });
  });

  it("shows a refused code against the code field", async () => {
    server.use(
      http.post(`${BASE}/api/account/change-password`, () =>
        HttpResponse.json(
          { success: false, message: "That code is not valid.", code: "TWO_FACTOR_CODE_INVALID" },
          { status: 401 },
        ),
      ),
    );

    await expect(changePasswordAction(EMPTY, WITH_CODE)).resolves.toEqual({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    });
    expect(setSession).not.toHaveBeenCalled();
  });

  it("validates before calling anything", async () => {
    const state = await changePasswordAction(
      EMPTY,
      form({ currentPassword: "oldpass", newPassword: "short", confirmPassword: "short" }),
    );

    expect(state.fieldErrors?.newPassword).toBe("Use at least 8 characters.");
  });
});

describe("setPasswordAction", () => {
  it("seals the pair and reports success", async () => {
    server.use(
      http.post(`${BASE}/api/account/set-password`, () =>
        HttpResponse.json({ success: true, message: null, data: PAIR }),
      ),
    );

    const state = await setPasswordAction(
      EMPTY,
      form({ newPassword: "Chores12!", confirmPassword: "Chores12!" }),
    );

    expect(state).toEqual({ error: null, done: "set" });
    expect(setSession).toHaveBeenCalledTimes(1);
  });

  it("shows a refused code against the code field", async () => {
    server.use(
      http.post(`${BASE}/api/account/set-password`, () =>
        HttpResponse.json(
          { success: false, message: "That code is not valid.", code: "TWO_FACTOR_CODE_INVALID" },
          { status: 401 },
        ),
      ),
    );

    const state = await setPasswordAction(
      EMPTY,
      form({ newPassword: "Chores12!", confirmPassword: "Chores12!", code: "123456" }),
    );

    expect(state.fieldErrors).toEqual({ code: "That code is not valid." });
  });

  it("keeps a 401 that named no credential as a banner, since that is the session", async () => {
    server.use(
      http.post(`${BASE}/api/account/set-password`, () =>
        HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
      ),
    );

    const state = await setPasswordAction(
      EMPTY,
      form({ newPassword: "Chores12!", confirmPassword: "Chores12!", code: "123456" }),
    );

    expect(state.fieldErrors).toBeUndefined();
    expect(state.error).toBe("Unauthorized");
  });
});
