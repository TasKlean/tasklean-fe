import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session/session", () => ({ getSession }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

import { GET } from "@/app/api/image/[uid]/route";

const BASE = "http://api.test";
const OBJECT = "https://bucket.test/group-photo/up-1.webp";
const SIGNED = `${OBJECT}?X-Amz-Signature=secret`;
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "a".repeat(32);
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  getSession.mockResolvedValue({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" });
});

function call(uid: string) {
  return GET(new Request(`http://app.test/api/image/${uid}`), {
    params: Promise.resolve({ uid }),
  });
}

function signsTheRead() {
  return http.get(`${BASE}/api/uploads/up-1`, () =>
    HttpResponse.json({
      success: true,
      message: null,
      data: { url: SIGNED, expiresInSeconds: 900 },
    }),
  );
}

function servesTheObject() {
  return http.get(OBJECT, () =>
    HttpResponse.arrayBuffer(WEBP.buffer as ArrayBuffer, {
      headers: { "Content-Type": "image/webp" },
    }),
  );
}

describe("image route", () => {
  it("streams the object with the type it was stored as", async () => {
    server.use(signsTheRead(), servesTheObject());

    const response = await call("up-1");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(WEBP);
  });

  it("caches privately for an hour, since a uid is immutable", async () => {
    server.use(signsTheRead(), servesTheObject());

    const response = await call("up-1");

    expect(response.headers.get("cache-control")).toBe("private, max-age=3600, immutable");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("never hands the signed bucket URL to the caller", async () => {
    server.use(signsTheRead(), servesTheObject());

    const response = await call("up-1");

    expect([...response.headers].flat().join(" ")).not.toContain("bucket.test");
  });

  it("answers 401 when there is no session, without reaching the API", async () => {
    getSession.mockResolvedValue(null);

    expect((await call("up-1")).status).toBe(401);
  });

  it("answers 404 when the backend refuses, so a refusal and a miss look alike", async () => {
    server.use(
      http.get(`${BASE}/api/uploads/up-1`, () =>
        HttpResponse.json({ success: false, message: "No", data: null }, { status: 403 }),
      ),
    );

    expect((await call("up-1")).status).toBe(404);
  });

  it("answers 404 for a uid the rule rejects, without reaching the API", async () => {
    expect((await call("")).status).toBe(404);
  });

  it("answers 404 for a signed read of an object the bucket no longer holds", async () => {
    server.use(
      signsTheRead(),
      http.get(OBJECT, () => new HttpResponse(null, { status: 404 })),
    );

    expect((await call("up-1")).status).toBe(404);
  });

  it("answers 502 when the object itself cannot be fetched", async () => {
    server.use(
      signsTheRead(),
      http.get(OBJECT, () => new HttpResponse(null, { status: 500 })),
    );

    expect((await call("up-1")).status).toBe(502);
  });
});
