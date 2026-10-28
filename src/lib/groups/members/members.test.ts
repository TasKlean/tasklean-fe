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
import { changeMemberRole, listGroupMembers, removeMember } from "@/lib/groups/members/members";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

type Seen = { url?: string; method?: string; body?: unknown };

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

function member(uid: string, role: string, name?: string) {
  return { uid, role, isActive: true, user: { uid: `u-${uid}`, name } };
}

describe("listGroupMembers", () => {
  it("puts the admins first, then orders by name", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1/members`, () =>
        envelope([
          member("m1", "GROUP_MEMBER", "Ana"),
          member("m2", "GROUP_MEMBER", "Bojan"),
          member("m3", "GROUP_ADMIN", "Zala"),
          member("m4", "GROUP_ADMIN", "Matej"),
        ]),
      ),
    );

    const members = await listGroupMembers("g1");

    expect(members.map((row) => row.uid)).toEqual(["m4", "m3", "m1", "m2"]);
  });

  it("sorts a member with no readable name last within their own role", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1/members`, () =>
        envelope([member("m1", "GROUP_MEMBER"), member("m2", "GROUP_MEMBER", "Ana")]),
      ),
    );

    const members = await listGroupMembers("g1");

    expect(members.map((row) => row.uid)).toEqual(["m2", "m1"]);
  });

  it("answers with an empty list when the envelope carried no array", async () => {
    server.use(http.get(`${BASE}/api/groups/g1/members`, () => envelope(undefined)));

    await expect(listGroupMembers("g1")).resolves.toEqual([]);
  });

  it("encodes a group uid that came from the URL", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/:uid/members`, ({ request }) => {
        seen.url = request.url;
        return envelope([]);
      }),
    );

    await listGroupMembers("a/b");

    expect(seen.url).toBe(`${BASE}/api/groups/a%2Fb/members`);
  });
});

describe("changeMemberRole", () => {
  it("patches the membership with the new role", async () => {
    const seen: Seen = {};
    server.use(
      http.patch(`${BASE}/api/group-members/m1/role`, async ({ request }) => {
        seen.method = request.method;
        seen.body = await request.json();
        return envelope(member("m1", "GROUP_ADMIN", "Ana"));
      }),
    );

    const updated = await changeMemberRole("m1", "GROUP_ADMIN");

    expect(seen.body).toEqual({ role: "GROUP_ADMIN" });
    expect(updated.role).toBe("GROUP_ADMIN");
  });

  it("leaves the last-admin refusal as a 409 for the caller to phrase", async () => {
    server.use(
      http.patch(`${BASE}/api/group-members/m1/role`, () =>
        HttpResponse.json(
          { success: false, message: "A group must have at least one admin" },
          { status: 409 },
        ),
      ),
    );

    await expect(changeMemberRole("m1", "GROUP_MEMBER")).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.status === 409,
    );
  });
});

describe("removeMember", () => {
  it("deletes the membership, which is also how leaving works", async () => {
    const seen: Seen = {};
    server.use(
      http.delete(`${BASE}/api/group-members/m1`, ({ request }) => {
        seen.method = request.method;
        seen.url = request.url;
        return envelope(null);
      }),
    );

    await removeMember("m1");

    expect(seen.method).toBe("DELETE");
    expect(seen.url).toBe(`${BASE}/api/group-members/m1`);
  });
});
