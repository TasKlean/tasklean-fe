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

import {
  createGroupAction,
  type CreateGroupState,
} from "@/app/(app)/app/groups/new/actions/actions";

const BASE = "http://api.test";
const EMPTY: CreateGroupState = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

function createHandler(data: unknown, status = 200, seen?: { body?: unknown }) {
  return http.post(`${BASE}/api/groups`, async ({ request }) => {
    if (seen) seen.body = await request.json();
    return HttpResponse.json({ success: status < 400, message: "Nope", data }, { status });
  });
}

describe("createGroupAction", () => {
  it("refuses a group with no name without calling the backend", async () => {
    const result = await createGroupAction(EMPTY, form({ name: "   " }));

    expect(result.fieldErrors?.name).toBe("Enter a name for the group.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("echoes what was typed back, so a submit without JS loses nothing", async () => {
    const result = await createGroupAction(EMPTY, form({ name: "", description: "Upstairs" }));

    expect(result.values).toEqual({ name: "", description: "Upstairs", photoUrl: "" });
  });

  it("sends the trimmed details and lands in the new group", async () => {
    const seen: { body?: unknown } = {};
    server.use(createHandler({ uid: "g1", name: "Flat 12" }, 200, seen));

    await expect(
      createGroupAction(EMPTY, form({ name: " Flat 12 ", description: " Upstairs " })),
    ).rejects.toThrow("REDIRECT:/app/groups/g1");

    expect(seen.body).toEqual({ name: "Flat 12", description: "Upstairs" });
    expect(revalidatePath).toHaveBeenCalledWith("/app");
  });

  it("goes to the list when the response carried no uid, since the group exists", async () => {
    server.use(createHandler({ name: "Flat 12" }));

    await expect(createGroupAction(EMPTY, form({ name: "Flat 12" }))).rejects.toThrow(
      "REDIRECT:/app",
    );
  });

  it("reports the backend's own message on a refusal", async () => {
    server.use(createHandler(null, 400));

    const result = await createGroupAction(EMPTY, form({ name: "Flat 12" }));

    expect(result.error).toBe("Nope");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("keeps what was typed when the backend refused", async () => {
    server.use(createHandler(null, 400));

    const result = await createGroupAction(EMPTY, form({ name: "Flat 12" }));

    expect(result.values?.name).toBe("Flat 12");
  });
});
