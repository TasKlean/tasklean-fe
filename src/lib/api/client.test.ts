import { HttpResponse, http } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { ApiError, ApiResponseFormatError } from "@/lib/api/errors";
import { request } from "@/lib/api/client";
import { server } from "@/test/msw";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = `${BASE}/`;
  process.env.SESSION_SECRET = "a".repeat(32);
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

describe("request", () => {
  it("unwraps the envelope and returns data", async () => {
    server.use(
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json({ success: true, message: null, data: { uid: "u1", email: "a@b.c" } }),
      ),
    );

    await expect(request<{ uid: string; email: string }>("/api/users/me")).resolves.toEqual({
      uid: "u1",
      email: "a@b.c",
    });
  });

  it("treats 201 as success, since POSTs return 201 while the spec says 200", async () => {
    server.use(
      http.post(`${BASE}/api/tasks`, () =>
        HttpResponse.json({ success: true, message: null, data: { uid: "t1" } }, { status: 201 }),
      ),
    );

    await expect(
      request<{ uid: string }>("/api/tasks", { method: "POST", body: { name: "Dishes" } }),
    ).resolves.toEqual({ uid: "t1" });
  });

  it("sends the bearer token, JSON content type and serialised body", async () => {
    let seenAuth: string | null = null;
    let seenContentType: string | null = null;
    let seenBody: unknown = null;

    server.use(
      http.post(`${BASE}/api/tasks`, async ({ request: req }) => {
        seenAuth = req.headers.get("Authorization");
        seenContentType = req.headers.get("Content-Type");
        seenBody = await req.json();
        return HttpResponse.json({ success: true, data: null });
      }),
    );

    await request<void>("/api/tasks", {
      method: "POST",
      body: { name: "Dishes" },
      accessToken: "token-123",
    });

    expect(seenAuth).toBe("Bearer token-123");
    expect(seenContentType).toContain("application/json");
    expect(seenBody).toEqual({ name: "Dishes" });
  });

  it("builds scope query parameters and omits null/undefined ones", async () => {
    let seenUrl = "";
    server.use(
      http.get(`${BASE}/api/tasks`, ({ request: req }) => {
        seenUrl = req.url;
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    await request<unknown[]>("/api/tasks", {
      query: { groupId: 7, done: false, assignedToId: null, cursor: undefined },
    });

    const url = new URL(seenUrl);
    expect(url.searchParams.get("groupId")).toBe("7");
    expect(url.searchParams.get("done")).toBe("false");
    expect(url.searchParams.has("assignedToId")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
  });

  it("throws ApiError carrying the backend's human-readable message on 409", async () => {
    server.use(
      http.post(`${BASE}/api/categories`, () =>
        HttpResponse.json(
          { success: false, message: "A category named 'Kitchen' already exists.", data: null },
          { status: 409 },
        ),
      ),
    );

    await expect(request("/api/categories", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "A category named 'Kitchen' already exists.",
    });
  });

  it.each([401, 403, 404, 500])("throws ApiError with the status on %i", async (status) => {
    server.use(
      http.get(`${BASE}/api/thing`, () =>
        HttpResponse.json({ success: false, message: "nope", data: null }, { status }),
      ),
    );

    const error = await request("/api/thing").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    expect((error as ApiError).message).toBe("nope");
  });

  it("exposes Retry-After as seconds on 429", async () => {
    server.use(
      http.get(`${BASE}/api/thing`, () =>
        HttpResponse.json(
          { success: false, message: "Too many requests.", data: null },
          { status: 429, headers: { "Retry-After": "42" } },
        ),
      ),
    );

    const error = await request("/api/thing").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).retryAfterSeconds).toBe(42);
  });

  it("leaves retryAfterSeconds null when the header is absent", async () => {
    server.use(
      http.get(`${BASE}/api/thing`, () =>
        HttpResponse.json(
          { success: false, message: "Too many requests.", data: null },
          { status: 429 },
        ),
      ),
    );

    const error = await request("/api/thing").catch((e: unknown) => e);
    expect((error as ApiError).retryAfterSeconds).toBeNull();
  });

  it("falls back to a status message when the envelope carries none", async () => {
    server.use(
      http.get(`${BASE}/api/thing`, () =>
        HttpResponse.json({ success: false, data: null }, { status: 500 }),
      ),
    );

    await expect(request("/api/thing")).rejects.toThrow("Request failed with status 500.");
  });

  it("returns undefined for an empty 2xx body", async () => {
    server.use(http.delete(`${BASE}/api/tags/1`, () => new HttpResponse(null, { status: 204 })));

    await expect(request<void>("/api/tags/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws ApiResponseFormatError when a 2xx body is not JSON", async () => {
    server.use(
      http.get(`${BASE}/api/thing`, () => new HttpResponse("<html>nope</html>", { status: 200 })),
    );

    await expect(request("/api/thing")).rejects.toBeInstanceOf(ApiResponseFormatError);
  });

  it("throws ApiResponseFormatError when a 2xx body is JSON but not the envelope", async () => {
    server.use(http.get(`${BASE}/api/thing`, () => HttpResponse.json([1, 2, 3])));

    await expect(request("/api/thing")).rejects.toBeInstanceOf(ApiResponseFormatError);
  });

  it("still throws ApiError when an error body is not JSON", async () => {
    server.use(
      http.get(
        `${BASE}/api/thing`,
        () => new HttpResponse("<html>gateway</html>", { status: 502 }),
      ),
    );

    const error = await request("/api/thing").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
  });
});
