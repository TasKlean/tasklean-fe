import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () =>
    new Headers({ "user-agent": "Vitest UA", "cf-connecting-ip": "203.0.113.9" }),
}));
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions/actions";

const BASE = "http://api.test";
const EMPTY: ForgotPasswordState = { error: null };

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

function accepted() {
  return http.post(`${BASE}/api/auth/forgot-password`, () =>
    HttpResponse.json({
      success: true,
      message: "If that email is registered, a reset link has been sent",
      data: null,
    }),
  );
}

describe("forgotPasswordAction validation", () => {
  it("rejects a malformed address without calling the API", async () => {
    const state = await forgotPasswordAction(EMPTY, form({ email: "nope" }));

    expect(state.fieldErrors?.email).toBe("Enter a valid email address.");
    expect(state.notice).toBeUndefined();
  });

  it("echoes the address back so a rejected submit keeps it", async () => {
    const state = await forgotPasswordAction(EMPTY, form({ email: "  nope  " }));

    expect(state.email).toBe("nope");
  });
});

describe("forgotPasswordAction success", () => {
  it("stays on the page with a notice that does not confirm the account", async () => {
    server.use(accepted());

    const state = await forgotPasswordAction(EMPTY, form({ email: "a@b.test" }));

    expect(state.error).toBeNull();
    expect(state.notice).toContain("If that address has an account");
    expect(state.email).toBe("a@b.test");
  });

  it("answers the same way for an address with no account", async () => {
    server.use(accepted());

    const known = await forgotPasswordAction(EMPTY, form({ email: "a@b.test" }));
    const unknown = await forgotPasswordAction(EMPTY, form({ email: "nobody@b.test" }));

    expect(unknown.notice).toBe(known.notice);
  });
});

describe("forgotPasswordAction failure", () => {
  it("turns a 429 into a retry window", async () => {
    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts.", data: null },
          { status: 429, headers: { "Retry-After": "3600" } },
        ),
      ),
    );

    const state = await forgotPasswordAction(EMPTY, form({ email: "a@b.test" }));

    expect(state.error).toBe("Too many attempts. Please try again in 60 minutes.");
    expect(state.notice).toBeUndefined();
  });

  it("shows the message the API sent", async () => {
    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, () =>
        HttpResponse.json(
          { success: false, message: "Mail is down.", data: null },
          { status: 500 },
        ),
      ),
    );

    const state = await forgotPasswordAction(EMPTY, form({ email: "a@b.test" }));

    expect(state.error).toBe("Mail is down.");
  });
});

describe("forgotPasswordAction device attribution", () => {
  it("carries the end user's address", async () => {
    const seen: { headers?: Headers } = {};
    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({ success: true, message: "Sent.", data: null });
      }),
    );

    await forgotPasswordAction(EMPTY, form({ email: "maja@example.com" }));

    expect(seen.headers?.get("x-device-ip")).toBe("203.0.113.9");
  });
});
