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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import {
  changeMemberRoleAction,
  leaveGroupAction,
  removeMemberAction,
} from "@/app/(app)/app/groups/[uid]/members/actions/actions";

const BASE = "http://api.test";
const EMPTY = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("changeMemberRoleAction", () => {
  it("sends the role the form asked for", async () => {
    let sent: unknown = null;
    server.use(
      http.patch(`${BASE}/api/group-members/m1/role`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: true, message: null, data: { uid: "m1" } });
      }),
    );

    const state = await changeMemberRoleAction(
      EMPTY,
      form({ groupUid: "g1", memberUid: "m1", role: "GROUP_ADMIN" }),
    );

    expect(sent).toEqual({ role: "GROUP_ADMIN" });
    expect(state).toEqual({ error: null });
  });

  it("phrases the last-admin refusal with the way out of it", async () => {
    server.use(
      http.patch(`${BASE}/api/group-members/m1/role`, () =>
        HttpResponse.json(
          { success: false, message: "A group must have at least one admin", data: null },
          { status: 409 },
        ),
      ),
    );

    const state = await changeMemberRoleAction(
      EMPTY,
      form({ groupUid: "g1", memberUid: "m1", role: "GROUP_MEMBER" }),
    );

    expect(state.error).toBe(
      "A group must have at least one admin. Make someone else an admin first.",
    );
  });

  it("refuses a role the backend does not have, without calling it", async () => {
    const state = await changeMemberRoleAction(
      EMPTY,
      form({ groupUid: "g1", memberUid: "m1", role: "OWNER" }),
    );

    expect(state.error).toBe("Pick a role.");
  });
});

describe("removeMemberAction", () => {
  it("ends the membership the form named", async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/api/group-members/m2`, () => {
        called = true;
        return HttpResponse.json({ success: true, message: null, data: null });
      }),
    );

    const state = await removeMemberAction(EMPTY, form({ groupUid: "g1", memberUid: "m2" }));

    expect(called).toBe(true);
    expect(state).toEqual({ error: null });
  });

  it("reports what the backend refused", async () => {
    server.use(
      http.delete(`${BASE}/api/group-members/m2`, () =>
        HttpResponse.json(
          { success: false, message: "Not allowed here.", data: null },
          { status: 403 },
        ),
      ),
    );

    const state = await removeMemberAction(EMPTY, form({ groupUid: "g1", memberUid: "m2" }));

    expect(state.error).toBe("Not allowed here.");
  });

  it("refuses a press that named no member", async () => {
    const state = await removeMemberAction(EMPTY, form({ groupUid: "g1" }));

    expect(state.error).toBe("Pick a member.");
  });
});

describe("leaveGroupAction", () => {
  it("leaves for the list once the membership is gone", async () => {
    server.use(
      http.delete(`${BASE}/api/group-members/m1`, () =>
        HttpResponse.json({ success: true, message: null, data: null }),
      ),
    );

    await expect(
      leaveGroupAction(EMPTY, form({ groupUid: "g1", memberUid: "m1" })),
    ).rejects.toThrow("REDIRECT:/app?left=1");
  });

  it("stays put when the group will not let the last admin go", async () => {
    server.use(
      http.delete(`${BASE}/api/group-members/m1`, () =>
        HttpResponse.json(
          { success: false, message: "A group must have at least one admin", data: null },
          { status: 409 },
        ),
      ),
    );

    const state = await leaveGroupAction(EMPTY, form({ groupUid: "g1", memberUid: "m1" }));

    expect(state.error).toBe(
      "A group must have at least one admin. Make someone else an admin first.",
    );
  });
});
