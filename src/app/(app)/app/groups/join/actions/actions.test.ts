import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const revalidatePath = vi.fn();

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import { joinGroupAction, type JoinGroupState } from "@/app/(app)/app/groups/join/actions/actions";

const BASE = "http://api.test";
const EMPTY: JoinGroupState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  revalidatePath.mockClear();
});

function form(inviteCode: string): FormData {
  const data = new FormData();
  data.append("inviteCode", inviteCode);
  return data;
}

function joinHandler(data: unknown, status = 200, seen?: { body?: unknown }) {
  return http.post(`${BASE}/api/groups/join`, async ({ request }) => {
    if (seen) seen.body = await request.json();
    return HttpResponse.json(
      { success: status < 400, message: "Invalid invite code", data },
      { status },
    );
  });
}

describe("joinGroupAction", () => {
  it("refuses a code of the wrong shape without spending a join attempt", async () => {
    const result = await joinGroupAction(EMPTY, form("A1B2"));

    expect(result.fieldErrors?.inviteCode).toBe("An invite code is 8 letters and numbers.");
  });

  it("normalises the code before sending it, and lands in the group", async () => {
    const seen: { body?: unknown } = {};
    server.use(joinHandler({ uid: "g1", myRole: "GROUP_MEMBER" }, 200, seen));

    await expect(joinGroupAction(EMPTY, form(" a1b2-c3d4 "))).rejects.toThrow(
      "REDIRECT:/app/groups/g1",
    );

    expect(seen.body).toEqual({ inviteCode: "A1B2C3D4" });
    expect(revalidatePath).toHaveBeenCalledWith("/app");
  });

  it("shows a 404 against the field, saying nothing about which kind it was", async () => {
    server.use(joinHandler(null, 404));

    const result = await joinGroupAction(EMPTY, form("a1b2c3d4"));

    expect(result.fieldErrors?.inviteCode).toBe(
      "That code is not valid. Check it with whoever shared it.",
    );
    expect(result.error).toBeNull();
  });

  it("flags a 409 rather than phrasing it, since the screen answers with a link", async () => {
    server.use(joinHandler(null, 409));

    const result = await joinGroupAction(EMPTY, form("a1b2c3d4"));

    expect(result).toMatchObject({ error: null, alreadyMember: true });
    expect(result.fieldErrors).toBeUndefined();
  });

  it("composes the 429 window, because the join bucket is the tight one", async () => {
    server.use(
      http.post(`${BASE}/api/groups/join`, () =>
        HttpResponse.json(
          { success: false, message: "Too many attempts." },
          { status: 429, headers: { "Retry-After": "120" } },
        ),
      ),
    );

    const result = await joinGroupAction(EMPTY, form("a1b2c3d4"));

    expect(result.error).toBe("Too many attempts. Please try again in 2 minutes.");
  });

  it("keeps the typed code after every refusal", async () => {
    server.use(joinHandler(null, 404));

    const result = await joinGroupAction(EMPTY, form(" a1b2-c3d4 "));

    expect(result.inviteCode).toBe(" a1b2-c3d4 ");
  });

  it("goes to the list when the response carried no uid", async () => {
    server.use(joinHandler({ myRole: "GROUP_MEMBER" }));

    await expect(joinGroupAction(EMPTY, form("a1b2c3d4"))).rejects.toThrow("REDIRECT:/app");
  });
});
