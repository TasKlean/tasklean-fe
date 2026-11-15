import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const setSession = vi.fn();

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" }),
  setSession: (session: unknown) => setSession(session),
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

import {
  updateProfileAction,
  type ProfileState,
} from "@/app/(app)/app/settings/profile/actions/actions";

const BASE = "http://api.test";
const EMPTY: ProfileState = { error: null, saved: false };

const SAVED = {
  uid: "u1",
  name: "Ada",
  lastName: "Lovelace",
  photoUid: "up-1",
  photoUrl: null,
};

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  setSession.mockClear();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

function saveHandler(seen: { path?: string; body?: unknown }) {
  return http.put(`${BASE}/api/users/:uid`, async ({ request, params }) => {
    seen.path = String(params.uid);
    seen.body = await request.json();
    return HttpResponse.json({ success: true, message: null, data: SAVED });
  });
}

describe("updateProfileAction", () => {
  it("saves the account the session names, never one the press carries", async () => {
    const seen: { path?: string } = {};
    server.use(saveHandler(seen));

    const state = await updateProfileAction(
      EMPTY,
      form({ name: "Ada", lastName: "Lovelace", uid: "u2", userUid: "u2" }),
    );

    expect(state).toEqual({ error: null, saved: true });
    expect(seen.path).toBe("u1");
  });

  it("posts the picture the form carried, so a name change keeps the avatar", async () => {
    const seen: { body?: unknown } = {};
    server.use(saveHandler(seen));

    await updateProfileAction(EMPTY, form({ name: "Ada", lastName: "Lovelace", photoUid: "up-1" }));

    expect(seen.body).toEqual({ name: "Ada", lastName: "Lovelace", photoUid: "up-1" });
  });

  it("reseals the chrome from what was saved, dropping the picture it replaced", async () => {
    server.use(saveHandler({}));

    await updateProfileAction(EMPTY, form({ name: "Ada", lastName: "Lovelace" }));

    expect(setSession).toHaveBeenCalledWith({
      accessToken: "at-1",
      refreshToken: "rt-1",
      userUid: "u1",
      name: "Ada",
      photoUid: "up-1",
    });
  });

  it("reports an invalid name on the field and never calls the backend", async () => {
    const seen: { path?: string } = {};
    server.use(saveHandler(seen));

    const state = await updateProfileAction(EMPTY, form({ name: "Mary Jane", lastName: "L" }));

    expect(state.fieldErrors).toEqual({ name: "Use one word, without spaces." });
    expect(state.values).toEqual({ name: "Mary Jane", middleName: "", lastName: "L" });
    expect(seen.path).toBeUndefined();
  });

  it("keeps what was typed when the backend refuses the save", async () => {
    server.use(
      http.put(`${BASE}/api/users/:uid`, () =>
        HttpResponse.json(
          { success: false, message: "Upload not usable", code: "UPLOAD_NOT_USABLE", data: null },
          { status: 400 },
        ),
      ),
    );

    const state = await updateProfileAction(EMPTY, form({ name: "Ada", lastName: "Lovelace" }));

    expect(state.saved).toBe(false);
    expect(state.error).toBe("Upload not usable");
    expect(state.values).toEqual({ name: "Ada", middleName: "", lastName: "Lovelace" });
    expect(setSession).not.toHaveBeenCalled();
  });
});
