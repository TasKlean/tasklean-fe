import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
  }),
}));

import { isApiError } from "@/lib/api/errors";
import { readUpload, requestUpload } from "@/lib/uploads/uploads";
import type { UploadRequest } from "@/lib/uploads/uploads.types";

const BASE = "http://api.test";

const FIELDS: UploadRequest = {
  purpose: "GROUP_PHOTO",
  targetUid: "g1",
  contentType: "image/webp",
  sizeBytes: 20481,
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

function refusal(status: number) {
  return HttpResponse.json({ success: false, message: "No", data: null }, { status });
}

describe("requestUpload", () => {
  it("posts the purpose, the target, the type and the exact size", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/uploads`, async ({ request }) => {
        body = await request.json();
        return envelope({
          uid: "up-1",
          uploadUrl: "https://bucket.test/put",
          expiresInSeconds: 300,
        });
      }),
    );

    await requestUpload(FIELDS);

    expect(body).toEqual(FIELDS);
  });

  it("returns the uid and the URL to upload to", async () => {
    server.use(
      http.post(`${BASE}/api/uploads`, () =>
        envelope({ uid: "up-1", uploadUrl: "https://bucket.test/put", expiresInSeconds: 300 }),
      ),
    );

    await expect(requestUpload(FIELDS)).resolves.toEqual({
      uid: "up-1",
      uploadUrl: "https://bucket.test/put",
    });
  });

  it("throws a TypeError when the URL is missing", async () => {
    server.use(http.post(`${BASE}/api/uploads`, () => envelope({ uid: "up-1" })));

    await expect(requestUpload(FIELDS)).rejects.toThrow(TypeError);
  });

  it("throws a TypeError when the uid is missing", async () => {
    server.use(
      http.post(`${BASE}/api/uploads`, () => envelope({ uploadUrl: "https://bucket.test/put" })),
    );

    await expect(requestUpload(FIELDS)).rejects.toThrow(TypeError);
  });

  it("surfaces a refusal as an ApiError, not as a dead session", async () => {
    server.use(http.post(`${BASE}/api/uploads`, () => refusal(403)));

    await expect(requestUpload(FIELDS)).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.status === 403,
    );
  });
});

describe("readUpload", () => {
  it("encodes the uid into the path and returns the signed URL", async () => {
    let url: string | undefined;
    server.use(
      http.get(`${BASE}/api/uploads/:uid`, ({ request }) => {
        url = request.url;
        return envelope({ url: "https://bucket.test/get?sig=1", expiresInSeconds: 900 });
      }),
    );

    await expect(readUpload("up/1")).resolves.toBe("https://bucket.test/get?sig=1");
    expect(url).toBe(`${BASE}/api/uploads/up%2F1`);
  });

  it("throws a TypeError when no URL comes back", async () => {
    server.use(http.get(`${BASE}/api/uploads/:uid`, () => envelope({ expiresInSeconds: 900 })));

    await expect(readUpload("up-1")).rejects.toThrow(TypeError);
  });

  it("surfaces a refusal as an ApiError, since a 403 is not a missing image", async () => {
    server.use(http.get(`${BASE}/api/uploads/:uid`, () => refusal(403)));

    await expect(readUpload("up-1")).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.status === 403,
    );
  });
});
