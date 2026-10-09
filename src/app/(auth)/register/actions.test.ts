import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { registerAction, type RegisterState } from "@/app/(auth)/register/actions";
import { server } from "@/test/msw";

const BASE = "http://api.test";
const EMPTY: RegisterState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    name: "Maja",
    lastName: "Novak",
    email: "maja@example.com",
    password: "Chores12!",
    confirmPassword: "Chores12!",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("registerAction", () => {
  it("rejects an invalid form without calling the API", async () => {
    const state = await registerAction(EMPTY, form({ email: "nope", password: "short" }));

    expect(state.fieldErrors?.email).toBe("Enter a valid email address.");
    expect(state.fieldErrors?.password).toBe("Use at least 8 characters.");
    expect(state.error).toBeNull();
  });

  it("puts a taken address beside the email field, not in a banner", async () => {
    server.use(
      http.post(`${BASE}/api/auth/register`, () =>
        HttpResponse.json(
          { success: false, message: "Email already registered", data: null },
          { status: 409 },
        ),
      ),
    );

    const state = await registerAction(EMPTY, form());

    expect(state.fieldErrors?.email).toBe("Email already registered");
    expect(state.error).toBeNull();
  });

  it("turns a 429 into a retry window", async () => {
    server.use(
      http.post(`${BASE}/api/auth/register`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts.", data: null },
          { status: 429, headers: { "Retry-After": "900" } },
        ),
      ),
    );

    const state = await registerAction(EMPTY, form());

    expect(state.error).toBe("Too many attempts. Please try again in 15 minutes.");
  });

  it("keeps the typed values and never the password", async () => {
    const state = await registerAction(EMPTY, form({ email: "nope", password: "secret-value" }));

    expect(state.values?.name).toBe("Maja");
    expect(state.values?.email).toBe("nope");
    expect(JSON.stringify(state)).not.toContain("secret-value");
  });

  it("rejects a repeat that does not match, without calling the API", async () => {
    const state = await registerAction(EMPTY, form({ confirmPassword: "Chores12?" }));

    expect(state.fieldErrors?.confirmPassword).toBe("Passwords do not match.");
  });

  it("never sends the repeated password to the backend", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${BASE}/api/auth/register`, async ({ request: req }) => {
        body = (await req.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: false, message: "stop", data: null }, { status: 400 });
      }),
    );

    await registerAction(EMPTY, form());

    expect("confirmPassword" in body).toBe(false);
  });

  it("omits middleName when it is blank", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${BASE}/api/auth/register`, async ({ request: req }) => {
        body = (await req.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { success: false, message: "stop here", data: null },
          { status: 400 },
        );
      }),
    );

    await registerAction(EMPTY, form({ middleName: "   " }));

    expect("middleName" in body).toBe(false);
  });
});
