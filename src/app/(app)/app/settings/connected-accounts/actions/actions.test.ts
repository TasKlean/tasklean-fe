import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const setSession = vi.fn(async () => {});
const revalidatePath = vi.fn();

vi.mock("@/lib/auth/session/session", () => ({
  setSession: (...args: unknown[]) => setSession(...(args as [])),
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const jar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

import {
  type ConnectedAccountsActionState,
  linkGoogleAction,
  unlinkGoogleAction,
} from "@/app/(app)/app/settings/connected-accounts/actions/actions";

const BASE = "http://api.test";
const EMPTY: ConnectedAccountsActionState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  jar.clear();
  jar.set("tasklean_device", "dev-1");
  jar.set("tasklean_google_nonce", "raw-nonce-1");
  server.use(
    http.get(`${BASE}/api/users/me`, () =>
      HttpResponse.json({ success: true, message: null, data: { uid: "u1", name: "Bob" } }),
    ),
  );
});

afterEach(() => {
  setSession.mockClear();
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("linkGoogleAction", () => {
  it("sends the raw nonce, not the hash the widget was given", async () => {
    let sent: unknown = null;
    server.use(
      http.post(`${BASE}/api/account/connected-accounts/google`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({
          success: true,
          message: null,
          data: { passwordSet: true, googleLinked: true },
        });
      }),
    );

    await expect(linkGoogleAction({ error: null }, form({ idToken: "id-1" }))).resolves.toEqual({
      error: null,
    });
    expect(sent).toEqual({ idToken: "id-1", nonce: "raw-nonce-1" });
    expect(jar.has("tasklean_google_nonce")).toBe(false);
  });

  it("replaces the spent nonce when the backend refuses the credential", async () => {
    server.use(
      http.post(`${BASE}/api/account/connected-accounts/google`, () =>
        HttpResponse.json({ success: false, message: "Invalid Google token" }, { status: 401 }),
      ),
    );

    const state = await linkGoogleAction({ error: null }, form({ idToken: "id-1" }));

    expect(state.error).toBe("Invalid Google token");
    expect(state.nonceHash).toMatch(/^[0-9a-f]{64}$/);
    expect(jar.get("tasklean_google_nonce")).not.toBe("raw-nonce-1");
  });

  it("asks for another attempt when the nonce is gone", async () => {
    jar.delete("tasklean_google_nonce");

    const state = await linkGoogleAction({ error: null }, form({ idToken: "id-1" }));

    expect(state.error).toBe("That attempt expired. Please try again.");
  });
});

describe("unlinkGoogleAction", () => {
  it("reports the lockout refusal rather than pretending it worked", async () => {
    server.use(
      http.delete(`${BASE}/api/account/connected-accounts/google`, () =>
        HttpResponse.json(
          { success: false, message: "Set a password before unlinking Google." },
          { status: 409 },
        ),
      ),
    );

    await expect(unlinkGoogleAction(EMPTY)).resolves.toEqual({
      error: "Set a password before unlinking Google.",
    });
  });

  it("revalidates the page it leaves behind on success", async () => {
    server.use(
      http.delete(`${BASE}/api/account/connected-accounts/google`, () =>
        HttpResponse.json({
          success: true,
          message: null,
          data: { passwordSet: true, googleLinked: false },
        }),
      ),
    );

    await expect(unlinkGoogleAction(EMPTY)).resolves.toEqual({ error: null, done: true });
    expect(revalidatePath).toHaveBeenCalledWith("/app/settings/connected-accounts");
  });
});
