import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { register } from "@/lib/auth/signin/register";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("register", () => {
  it("posts the fields the backend requires", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/register`, async ({ request: req }) => {
        body = await req.json();
        return HttpResponse.json({
          success: true,
          message: "Verification code sent",
          data: { email: "maja@example.com", name: "Maja" },
        });
      }),
    );

    await register({
      email: "maja@example.com",
      name: "Maja",
      lastName: "Novak",
      password: "password123",
    });

    expect(body).toEqual({
      email: "maja@example.com",
      name: "Maja",
      lastName: "Novak",
      password: "password123",
    });
  });

  it("includes middleName only when given", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${BASE}/api/auth/register`, async ({ request: req }) => {
        body = (await req.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, message: null, data: {} });
      }),
    );

    await register({
      email: "maja@example.com",
      name: "Maja",
      lastName: "Novak",
      password: "password123",
      middleName: "Ana",
    });

    expect(body.middleName).toBe("Ana");
  });

  it("resolves even though no tokens come back", async () => {
    server.use(
      http.post(`${BASE}/api/auth/register`, () =>
        HttpResponse.json({
          success: true,
          message: "Verification code sent",
          data: { email: "maja@example.com" },
        }),
      ),
    );

    await expect(
      register({
        email: "maja@example.com",
        name: "Maja",
        lastName: "Novak",
        password: "password123",
      }),
    ).resolves.toBeUndefined();
  });

  it("surfaces the backend's message when the address is taken", async () => {
    server.use(
      http.post(`${BASE}/api/auth/register`, () =>
        HttpResponse.json(
          { success: false, message: "Email already registered", data: null },
          { status: 409 },
        ),
      ),
    );

    await expect(
      register({
        email: "taken@example.com",
        name: "Maja",
        lastName: "Novak",
        password: "password123",
      }),
    ).rejects.toThrow("Email already registered");
  });

  it("reports the retry window on a 429", async () => {
    server.use(
      http.post(`${BASE}/api/auth/register`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts", data: null },
          { status: 429, headers: { "Retry-After": "900" } },
        ),
      ),
    );

    await expect(
      register({
        email: "maja@example.com",
        name: "Maja",
        lastName: "Novak",
        password: "password123",
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterSeconds: 900 });
  });
});
