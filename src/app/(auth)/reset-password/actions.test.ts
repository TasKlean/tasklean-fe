import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const clearSession = vi.fn(async () => {});

vi.mock("@/lib/auth/session", () => ({
  clearSession: () => clearSession(),
}));

import { resetPasswordAction, type ResetPasswordState } from "@/app/(auth)/reset-password/actions";

const BASE = "http://api.test";
const EMPTY: ResetPasswordState = { error: null };
const GOOD = { token: "tok-1", password: "Chores12!", confirmPassword: "Chores12!" };

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

function accepted() {
  return http.post(`${BASE}/api/auth/reset-password`, () =>
    HttpResponse.json({
      success: true,
      message: "Password reset. You can now sign in with your new password.",
      data: null,
    }),
  );
}

async function redirectedTo(data: FormData): Promise<string | undefined> {
  const thrown = await resetPasswordAction(EMPTY, data).catch((error: unknown) => error);
  return String((thrown as { digest?: string }).digest).split(";")[2];
}

describe("resetPasswordAction validation", () => {
  it("rejects a weak password without spending the token", async () => {
    const state = await resetPasswordAction(
      EMPTY,
      form({ token: "tok-1", password: "short", confirmPassword: "short" }),
    );

    expect(state.fieldErrors?.password).toBe("Use at least 8 characters.");
    expect(state.error).toBeNull();
  });

  it("reports a mismatch against the repeat field", async () => {
    const state = await resetPasswordAction(EMPTY, form({ ...GOOD, confirmPassword: "Chores34!" }));

    expect(state.fieldErrors?.confirmPassword).toBe("Passwords do not match.");
  });

  it("reports a missing token as a page problem, not a field one", async () => {
    const state = await resetPasswordAction(EMPTY, form({ ...GOOD, token: "" }));

    expect(state.error).toBe("That reset link is incomplete. Ask for a new one.");
    expect(state.fieldErrors?.password).toBeUndefined();
  });

  it("never echoes the password back", async () => {
    const state = await resetPasswordAction(
      EMPTY,
      form({ token: "tok-1", password: "secret-value", confirmPassword: "secret-value" }),
    );

    expect(JSON.stringify(state)).not.toContain("secret-value");
  });
});

describe("resetPasswordAction success", () => {
  it("sends the new password and redirects to login with the notice flag", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/reset-password`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, message: "Password reset.", data: null });
      }),
    );

    expect(await redirectedTo(form(GOOD))).toBe("/login?reset=1");
    expect(body).toEqual({ token: "tok-1", newPassword: "Chores12!" });
  });

  it("clears the local session, which the backend has already revoked", async () => {
    server.use(accepted());

    await redirectedTo(form(GOOD));

    expect(clearSession).toHaveBeenCalledTimes(1);
  });
});

describe("resetPasswordAction failure", () => {
  it("shows a spent or expired token as the backend words it", async () => {
    server.use(
      http.post(`${BASE}/api/auth/reset-password`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid or expired reset token", data: null },
          { status: 401 },
        ),
      ),
    );

    const state = await resetPasswordAction(EMPTY, form(GOOD));

    expect(state.error).toBe("Invalid or expired reset token");
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("puts a policy disagreement against the password field", async () => {
    server.use(
      http.post(`${BASE}/api/auth/reset-password`, () =>
        HttpResponse.json(
          { success: false, message: "newPassword: Add a number.", data: null },
          { status: 400 },
        ),
      ),
    );

    const state = await resetPasswordAction(EMPTY, form(GOOD));

    expect(state.fieldErrors?.password).toBe("newPassword: Add a number.");
    expect(state.error).toBeNull();
  });

  it("turns a 429 into a retry window", async () => {
    server.use(
      http.post(`${BASE}/api/auth/reset-password`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts.", data: null },
          { status: 429, headers: { "Retry-After": "120" } },
        ),
      ),
    );

    const state = await resetPasswordAction(EMPTY, form(GOOD));

    expect(state.error).toBe("Too many attempts. Please try again in 2 minutes.");
  });
});
