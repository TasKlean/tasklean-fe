import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const clearSession = vi.fn(async () => {});

vi.mock("@/lib/auth/session", () => ({
  clearSession: () => clearSession(),
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import {
  deactivateAccountAction,
  type DeactivateState,
} from "@/app/(app)/app/settings/deactivate/actions";

const BASE = "http://api.test";

const PATH = `${BASE}/api/account/deactivate`;

const NOTHING: DeactivateState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

afterEach(() => {
  clearSession.mockClear();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function answers(status: number, message: string | null, code?: string) {
  return http.post(PATH, () =>
    HttpResponse.json({ success: status === 200, message, code, data: null }, { status }),
  );
}

describe("deactivateAccountAction", () => {
  it("clears the session and sends them to the sign-in screen", async () => {
    server.use(answers(200, null));

    await expect(deactivateAccountAction(NOTHING, form({ password: "Chores12!" }))).rejects.toThrow(
      "REDIRECT:/login?deactivated=1",
    );
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it("sends no password for an account that has none", async () => {
    let body: unknown;
    server.use(
      http.post(PATH, async ({ request }) => {
        body = await request.json().catch(() => undefined);
        return HttpResponse.json({ success: true, message: null, data: null });
      }),
    );

    await expect(deactivateAccountAction(NOTHING, form({ password: "" }))).rejects.toThrow(
      "REDIRECT:",
    );
    expect(body).toEqual({});
  });

  it("shows a refused password against that field, and keeps the session", async () => {
    server.use(answers(401, "Current password is incorrect", "PASSWORD_INVALID"));

    await expect(deactivateAccountAction(NOTHING, form({ password: "wrong" }))).resolves.toEqual({
      error: null,
      fieldErrors: { password: "Current password is incorrect" },
    });
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("does not blame the field for a 401 that said nothing about the password", async () => {
    server.use(answers(401, "Unauthorized"));

    const state = await deactivateAccountAction(NOTHING, form({ password: "Chores12!" }));

    expect(state.fieldErrors).toBeUndefined();
    expect(state.error).toBe("Unauthorized");
  });

  it("reports any other failure as the backend put it", async () => {
    server.use(answers(409, "This account is already deactivated."));

    const state = await deactivateAccountAction(NOTHING, form({ password: "Chores12!" }));

    expect(state.error).toBe("This account is already deactivated.");
    expect(clearSession).not.toHaveBeenCalled();
  });
});
