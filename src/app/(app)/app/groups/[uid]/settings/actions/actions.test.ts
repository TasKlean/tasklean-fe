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
  deleteGroupAction,
  rotateInviteCodeAction,
  updateGroupDetailsAction,
  type GroupDetailsState,
} from "@/app/(app)/app/groups/[uid]/settings/actions/actions";

const BASE = "http://api.test";
const EMPTY = { error: null };
const EMPTY_DETAILS: GroupDetailsState = { error: null, saved: false };

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

describe("updateGroupDetailsAction", () => {
  it("saves the name and description the form carried", async () => {
    let sent: unknown = null;
    server.use(
      http.put(`${BASE}/api/groups/g1`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: true, message: null, data: { uid: "g1" } });
      }),
    );

    const state = await updateGroupDetailsAction(
      EMPTY_DETAILS,
      form({
        groupUid: "g1",
        name: "  Flat 4  ",
        description: " Ours ",
        photoUrl: " https://img.test/flat.png ",
      }),
    );

    expect(sent).toEqual({
      name: "Flat 4",
      description: "Ours",
      photoUrl: "https://img.test/flat.png",
    });
    expect(state).toEqual({ error: null, saved: true });
  });

  it("reports a bad field without calling the backend, and echoes what was typed", async () => {
    const state = await updateGroupDetailsAction(
      EMPTY_DETAILS,
      form({ groupUid: "g1", name: "", description: "Ours" }),
    );

    expect(state.saved).toBe(false);
    expect(state.fieldErrors?.name).toBeTruthy();
    expect(state.values).toEqual({ name: "", description: "Ours", photoUrl: "" });
  });

  it("shows what the backend refused", async () => {
    server.use(
      http.put(`${BASE}/api/groups/g1`, () =>
        HttpResponse.json(
          { success: false, message: "Not allowed here.", data: null },
          { status: 403 },
        ),
      ),
    );

    const state = await updateGroupDetailsAction(
      EMPTY_DETAILS,
      form({ groupUid: "g1", name: "Flat 4", description: "" }),
    );

    expect(state).toEqual({
      error: "Not allowed here.",
      saved: false,
      values: { name: "Flat 4", description: "", photoUrl: "" },
    });
  });

  it("refuses a submit that named no group", async () => {
    const state = await updateGroupDetailsAction(
      EMPTY_DETAILS,
      form({ name: "Flat 4", description: "" }),
    );

    expect(state.error).toBe("Something went wrong. Please try again.");
    expect(state.saved).toBe(false);
  });
});

describe("rotateInviteCodeAction", () => {
  it("asks for a new code and says nothing, since the re-render carries it", async () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/groups/g1/invite-code`, () => {
        called = true;
        return HttpResponse.json({
          success: true,
          message: null,
          data: { uid: "g1", inviteCode: "NEW123" },
        });
      }),
    );

    const state = await rotateInviteCodeAction(EMPTY, form({ groupUid: "g1" }));

    expect(called).toBe(true);
    expect(state).toEqual({ error: null });
  });

  it("shows what the backend refused", async () => {
    server.use(
      http.post(`${BASE}/api/groups/g1/invite-code`, () =>
        HttpResponse.json(
          { success: false, message: "Not allowed here.", data: null },
          { status: 403 },
        ),
      ),
    );

    const state = await rotateInviteCodeAction(EMPTY, form({ groupUid: "g1" }));

    expect(state.error).toBe("Not allowed here.");
  });

  it("refuses a press that named no group", async () => {
    const state = await rotateInviteCodeAction(EMPTY, form({}));

    expect(state.error).toBe("Something went wrong. Please try again.");
  });
});

describe("deleteGroupAction", () => {
  it("leaves for the list once the group is gone", async () => {
    server.use(
      http.delete(`${BASE}/api/groups/g1`, () =>
        HttpResponse.json({ success: true, message: null, data: null }),
      ),
    );

    await expect(deleteGroupAction(EMPTY, form({ groupUid: "g1" }))).rejects.toThrow(
      "REDIRECT:/app?deleted=1",
    );
  });

  it("stays put and reports a refusal", async () => {
    server.use(
      http.delete(`${BASE}/api/groups/g1`, () =>
        HttpResponse.json(
          { success: false, message: "Only an admin can do that.", data: null },
          { status: 403 },
        ),
      ),
    );

    const state = await deleteGroupAction(EMPTY, form({ groupUid: "g1" }));

    expect(state.error).toBe("Only an admin can do that.");
  });
});
