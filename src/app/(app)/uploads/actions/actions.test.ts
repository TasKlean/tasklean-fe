import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" }),
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

import { requestUploadAction } from "@/app/(app)/uploads/actions/actions";
import { MAX_IMAGE_BYTES } from "@/lib/uploads/uploads.types";
import { UPLOAD_REFUSED } from "@/lib/uploads/uploads";

const BASE = "http://api.test";
const UPLOADS = `${BASE}/api/uploads`;

const REQUEST = {
  purpose: "GROUP_PHOTO",
  targetUid: "g1",
  contentType: "image/webp",
  sizeBytes: 48_000,
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

describe("requestUploadAction", () => {
  it("posts the measured request and hands back where to send the bytes", async () => {
    let sent: unknown = null;
    server.use(
      http.post(UPLOADS, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({
          success: true,
          message: null,
          data: { uid: "up-1", uploadUrl: "https://bucket.test/put?sig=1", expiresInSeconds: 300 },
        });
      }),
    );

    const ticket = await requestUploadAction(REQUEST);

    expect(sent).toEqual(REQUEST);
    expect(ticket).toEqual({ ok: true, uid: "up-1", uploadUrl: "https://bucket.test/put?sig=1" });
  });

  it("refuses an oversized request without spending a signature on it", async () => {
    const ticket = await requestUploadAction({ ...REQUEST, sizeBytes: MAX_IMAGE_BYTES + 1 });

    expect(ticket).toEqual({ ok: false, message: "Pictures are limited to 5 MB." });
  });

  it("refuses a purpose the backend has no rule for", async () => {
    const ticket = await requestUploadAction({ ...REQUEST, purpose: "TASK_PHOTO" });

    expect(ticket).toEqual({ ok: false, message: "Pick what the upload is for." });
  });

  it("says a 403 is a permission, naming neither a missing group nor a lost role", async () => {
    server.use(
      http.post(UPLOADS, () =>
        HttpResponse.json(
          { success: false, message: "Access Denied", data: null },
          { status: 403 },
        ),
      ),
    );

    expect(await requestUploadAction(REQUEST)).toEqual({ ok: false, message: UPLOAD_REFUSED });
  });

  it("shows the window a 429 carries rather than asking again", async () => {
    server.use(
      http.post(UPLOADS, () =>
        HttpResponse.json(
          { success: false, message: "Too many uploads.", data: null },
          { status: 429, headers: { "Retry-After": "600" } },
        ),
      ),
    );

    expect(await requestUploadAction(REQUEST)).toEqual({
      ok: false,
      message: "Too many uploads. Please try again in 10 minutes.",
    });
  });

  it("reports a presign that came back with no URL as a failure, not a ticket", async () => {
    server.use(
      http.post(UPLOADS, () =>
        HttpResponse.json({ success: true, message: null, data: { uid: "up-1" } }),
      ),
    );

    expect(await requestUploadAction(REQUEST)).toEqual({
      ok: false,
      message: "Something went wrong. Please try again.",
    });
  });
});
