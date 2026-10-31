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

import { loadAdminGroup } from "@/app/(app)/app/groups/[uid]/settings/settings.helpers";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function group(myRole: string) {
  return http.get(`${BASE}/api/groups/g1`, () =>
    HttpResponse.json({
      success: true,
      message: null,
      data: { uid: "g1", name: "Flat 12", myRole },
    }),
  );
}

describe("loadAdminGroup", () => {
  it("hands an admin the group", async () => {
    server.use(group("GROUP_ADMIN"));

    await expect(loadAdminGroup("g1")).resolves.toMatchObject({ uid: "g1", name: "Flat 12" });
  });

  it("sends a member to the section that is theirs", async () => {
    server.use(group("GROUP_MEMBER"));

    await expect(loadAdminGroup("g1")).rejects.toThrow(
      "REDIRECT:/app/groups/g1/settings/preferences",
    );
  });

  it("sends anything that is not the admin role the same way", async () => {
    server.use(group("SOMETHING_ELSE"));

    await expect(loadAdminGroup("g1")).rejects.toThrow(
      "REDIRECT:/app/groups/g1/settings/preferences",
    );
  });

  it("renders nothing when the group would not load, since the shell says so", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1`, () =>
        HttpResponse.json(
          { success: false, message: "The group is away.", data: null },
          { status: 500 },
        ),
      ),
    );

    await expect(loadAdminGroup("g1")).resolves.toBeNull();
  });
});
