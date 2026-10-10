import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { server } from "@/test/msw";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";

const BASE = "http://api.test";
const EMPTY: LoginState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("loginAction validation", () => {
  it("rejects a malformed email without calling the API", async () => {
    const state = await loginAction(EMPTY, form({ email: "nope", password: "password123" }));

    expect(state.fieldErrors?.email).toBe("Enter a valid email address.");
    expect(state.fieldErrors?.password).toBeUndefined();
    expect(state.error).toBeNull();
  });

  it("rejects a missing password", async () => {
    const state = await loginAction(EMPTY, form({ email: "a@b.test", password: "" }));

    expect(state.fieldErrors?.password).toBe("Enter your password.");
    expect(state.fieldErrors?.email).toBeUndefined();
  });

  it("reports both fields at once", async () => {
    const state = await loginAction(EMPTY, form({ email: "", password: "" }));

    expect(state.fieldErrors?.email).toBe("Enter your email address.");
    expect(state.fieldErrors?.password).toBe("Enter your password.");
  });

  it("echoes the email back so a rejected submit keeps it", async () => {
    const state = await loginAction(EMPTY, form({ email: "  a@b.test  ", password: "" }));

    expect(state.email).toBe("a@b.test");
  });

  it("never echoes the password", async () => {
    const state = await loginAction(EMPTY, form({ email: "nope", password: "secret-value" }));

    expect(JSON.stringify(state)).not.toContain("secret-value");
  });
});

describe("loginAction unverified handling", () => {
  it("redirects to verify-email and sends a new code", async () => {
    let resent = false;
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "Email not verified. Check your inbox for a verification code",
            data: null,
          },
          { status: 401 },
        ),
      ),
      http.post(`${BASE}/api/auth/resend-verification`, () => {
        resent = true;
        return HttpResponse.json({ success: true, message: null, data: null });
      }),
    );

    await expect(
      loginAction(EMPTY, form({ email: "a@b.test", password: "Chores12!" })),
    ).rejects.toThrow();
    expect(resent).toBe(true);
  });

  it("marks the redirect so the screen can warn the earlier code is dead", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          { success: false, message: "Email not verified.", data: null },
          { status: 401 },
        ),
      ),
      http.post(`${BASE}/api/auth/resend-verification`, () =>
        HttpResponse.json({ success: true, message: null, data: null }),
      ),
    );

    const redirect = await loginAction(
      EMPTY,
      form({ email: "a@b.test", password: "Chores12!" }),
    ).catch((error: unknown) => error);

    expect(String((redirect as { digest?: string }).digest)).toContain(
      "/verify-email?email=a%40b.test&resent=1",
    );
  });

  it("still redirects when the resend is rate limited", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          { success: false, message: "Email not verified.", data: null },
          { status: 401 },
        ),
      ),
      http.post(`${BASE}/api/auth/resend-verification`, () =>
        HttpResponse.json({ success: false, message: "Slow down.", data: null }, { status: 429 }),
      ),
    );

    await expect(
      loginAction(EMPTY, form({ email: "a@b.test", password: "Chores12!" })),
    ).rejects.toThrow();
  });

  it("shows a wrong password rather than redirecting", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid email or password", data: null },
          { status: 401 },
        ),
      ),
    );

    const state = await loginAction(EMPTY, form({ email: "a@b.test", password: "Chores12!" }));
    expect(state.error).toBe("Invalid email or password");
  });

  it("shows a deactivated account rather than redirecting", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          { success: false, message: "Account is deactivated", data: null },
          { status: 401 },
        ),
      ),
    );

    const state = await loginAction(EMPTY, form({ email: "a@b.test", password: "Chores12!" }));
    expect(state.error).toBe("Account is deactivated");
  });
});
