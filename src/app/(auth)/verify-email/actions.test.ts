import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { resendAction, verifyAction, type VerifyState } from "@/app/(auth)/verify-email/actions";
import { server } from "@/test/msw";

const BASE = "http://api.test";
const EMPTY: VerifyState = { error: null };

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

describe("verifyAction", () => {
  it("rejects a short code without calling the API", async () => {
    const state = await verifyAction(EMPTY, form({ email: "a@b.test", code: "123" }));

    expect(state.fieldErrors?.code).toBe("Enter all 6 digits.");
    expect(state.error).toBeNull();
  });

  it("rejects a malformed email without calling the API", async () => {
    const state = await verifyAction(EMPTY, form({ email: "nope", code: "123456" }));

    expect(state.fieldErrors?.email).toBe("Enter a valid email address.");
  });

  it("surfaces the backend's generic failure as a banner", async () => {
    server.use(
      http.post(`${BASE}/api/auth/verify-email`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid email or code", data: null },
          { status: 401 },
        ),
      ),
    );

    const state = await verifyAction(EMPTY, form({ email: "a@b.test", code: "999999" }));

    expect(state.error).toBe("Invalid email or code");
    expect(state.fieldErrors).toBeUndefined();
  });

  it("turns a 429 into a retry window", async () => {
    server.use(
      http.post(`${BASE}/api/auth/verify-email`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts.", data: null },
          { status: 429, headers: { "Retry-After": "120" } },
        ),
      ),
    );

    const state = await verifyAction(EMPTY, form({ email: "a@b.test", code: "123456" }));

    expect(state.error).toBe("Too many attempts. Please try again in 2 minutes.");
  });
});

describe("resendAction", () => {
  it("returns a notice that does not confirm the address exists", async () => {
    server.use(
      http.post(`${BASE}/api/auth/resend-verification`, () =>
        HttpResponse.json({ success: true, message: null, data: null }),
      ),
    );

    const state = await resendAction(EMPTY, form({ email: "nobody@example.com" }));

    expect(state.notice).toBe("If that address has an account, a new code is on its way.");
    expect(state.error).toBeNull();
  });

  it("rejects a malformed email without calling the API", async () => {
    const state = await resendAction(EMPTY, form({ email: "nope" }));

    expect(state.fieldErrors?.email).toBe("Enter a valid email address.");
  });

  it("turns a 429 into a retry window", async () => {
    server.use(
      http.post(`${BASE}/api/auth/resend-verification`, () =>
        HttpResponse.json(
          { success: false, message: "Slow down.", data: null },
          { status: 429, headers: { "Retry-After": "45" } },
        ),
      ),
    );

    const state = await resendAction(EMPTY, form({ email: "a@b.test" }));

    expect(state.error).toBe("Slow down. Please try again shortly.");
  });
});
