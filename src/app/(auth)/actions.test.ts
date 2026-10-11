import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hashNonce } from "@/lib/auth/google-nonce";
import { server } from "@/test/msw";

const setSession = vi.fn(async () => {});

vi.mock("@/lib/auth/session", () => ({
  setSession: (...args: unknown[]) => setSession(...(args as [])),
}));

const jar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

import { googleSignInAction, type GoogleSignInState } from "@/app/(auth)/actions";

const BASE = "http://api.test";
const EMPTY: GoogleSignInState = { error: null };
const TOKENS = { token: "access-1", refreshToken: "refresh-1", uid: "user-uid-1" };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  jar.clear();
  jar.set("tasklean_google_nonce", "raw-nonce-1");
});

afterEach(() => {
  setSession.mockClear();
  vi.restoreAllMocks();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function succeed(): void {
  server.use(
    http.post(`${BASE}/api/auth/google`, () =>
      HttpResponse.json({ success: true, message: null, data: TOKENS }),
    ),
  );
}

function fail(message: string, status = 401): void {
  server.use(
    http.post(`${BASE}/api/auth/google`, () =>
      HttpResponse.json({ success: false, message, data: null }, { status }),
    ),
  );
}

async function redirectedTo(data: FormData): Promise<string | undefined> {
  const thrown = await googleSignInAction(EMPTY, data).catch((error: unknown) => error);
  return String((thrown as { digest?: string }).digest).split(";")[2];
}

describe("googleSignInAction validation", () => {
  it("rejects a missing credential without calling the API", async () => {
    const state = await googleSignInAction(EMPTY, form({ idToken: "" }));

    expect(state.error).toBe("Google sign-in did not complete. Please try again.");
    expect(setSession).not.toHaveBeenCalled();
  });
});

describe("googleSignInAction nonce", () => {
  it("sends the raw nonce from the cookie, never its hash", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/auth/google`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, message: null, data: TOKENS });
      }),
    );

    await googleSignInAction(EMPTY, form({ idToken: "google-token" })).catch(() => {});

    expect(body).toEqual({ idToken: "google-token", nonce: "raw-nonce-1" });
  });

  it("spends the nonce on success", async () => {
    succeed();

    await googleSignInAction(EMPTY, form({ idToken: "google-token" })).catch(() => {});

    expect(jar.has("tasklean_google_nonce")).toBe(false);
  });

  it("replaces the nonce after a failure, and hands back its hash", async () => {
    fail("Invalid Google token");

    const state = await googleSignInAction(EMPTY, form({ idToken: "google-token" }));

    expect(jar.get("tasklean_google_nonce")).toMatch(/^[0-9a-f]{64}$/);
    expect(jar.get("tasklean_google_nonce")).not.toBe("raw-nonce-1");
    expect(state.nonceHash).toBe(await hashNonce(jar.get("tasklean_google_nonce") ?? ""));
  });

  it("refuses to call the API with no nonce at all", async () => {
    jar.clear();

    const state = await googleSignInAction(EMPTY, form({ idToken: "google-token" }));

    expect(state.error).toBe("That sign-in attempt expired. Please try again.");
    expect(state.nonceHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("googleSignInAction success", () => {
  it("starts the session with the returned pair", async () => {
    succeed();

    await googleSignInAction(EMPTY, form({ idToken: "google-token" })).catch(() => {});

    expect(setSession).toHaveBeenCalledWith({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      userUid: "user-uid-1",
      activeGroupId: null,
    });
  });

  it("redirects home when no next path was given", async () => {
    succeed();

    expect(await redirectedTo(form({ idToken: "google-token" }))).toBe("/");
  });

  it("redirects to the next path it was given", async () => {
    succeed();

    expect(await redirectedTo(form({ idToken: "google-token", next: "/groups" }))).toBe("/groups");
  });

  it("sends an off-site next path home instead", async () => {
    succeed();

    expect(await redirectedTo(form({ idToken: "google-token", next: "//evil.test" }))).toBe("/");
  });
});

describe("googleSignInAction failure", () => {
  it("shows the message the API sent", async () => {
    fail("Google account email is not verified");

    const state = await googleSignInAction(EMPTY, form({ idToken: "google-token" }));

    expect(state.error).toBe("Google account email is not verified");
    expect(setSession).not.toHaveBeenCalled();
  });

  it("falls back to a generic message and logs when the pair is missing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.post(`${BASE}/api/auth/google`, () =>
        HttpResponse.json({ success: true, message: null, data: { token: "access-1" } }),
      ),
    );

    const state = await googleSignInAction(EMPTY, form({ idToken: "google-token" }));

    expect(state.error).toBe("Something went wrong signing you in with Google. Please try again.");
    expect(logged).toHaveBeenCalled();
  });
});
