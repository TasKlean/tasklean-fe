import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({ accessToken: "at-1", refreshToken: "rt-1", userUid: "u1" }),
}));

import {
  memberRoster,
  subjectName,
} from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import type { AuditNames } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

function rosterOf(...members: unknown[]) {
  return http.get(`${BASE}/api/groups/g1/members`, () => envelope(members));
}

const ALICE = {
  uid: "m1",
  role: "GROUP_ADMIN",
  isActive: true,
  user: { uid: "u1", name: "Alice", lastName: "Johnson" },
};

const DAN = {
  uid: "m2",
  role: "GROUP_MEMBER",
  isActive: true,
  user: { uid: "u2", name: "Dan", lastName: "Novak" },
};

function filter(fields: Partial<AuditFilter> = {}): AuditFilter {
  return { type: null, ref: "", actor: "", from: "", to: "", ...fields };
}

const NAMES: AuditNames = {
  m2: { name: "Dan Novak", userUid: "u2" },
  m1: { name: "Alice Johnson", userUid: "u1" },
};

describe("subjectName", () => {
  it("names the membership the feed is pinned to", () => {
    expect(subjectName("g1", filter({ type: "member", ref: "m2" }), "Flat 2B", NAMES)).toBe(
      "Dan Novak",
    );
  });

  it("will not label another group's ref with this group's name", () => {
    expect(subjectName("g1", filter({ type: "group", ref: "g1" }), "Flat 2B", NAMES)).toBe(
      "Flat 2B",
    );
    expect(subjectName("g1", filter({ type: "group", ref: "g9" }), "Flat 2B", NAMES)).toBeNull();
  });

  it("names nothing for a kind no screen can resolve", () => {
    expect(subjectName("g1", filter({ type: "task", ref: "t1" }), "Flat 2B", NAMES)).toBeNull();
  });
});

describe("memberRoster", () => {
  it("asks for everyone who was ever in the group, so a trail can name who has left", async () => {
    let asked = "";
    server.use(
      http.get(`${BASE}/api/groups/g1/members`, ({ request }) => {
        asked = new URL(request.url).searchParams.get("status") ?? "";
        return envelope([ALICE]);
      }),
    );

    await memberRoster("g1");

    expect(asked).toBe("ALL");
  });

  it("lists the members a feed can be pinned to, in the order the roster gave", async () => {
    server.use(rosterOf(ALICE, DAN));

    const { members } = await memberRoster("g1");

    expect(members).toEqual([
      { ref: "m1", name: "Alice Johnson", former: false },
      { ref: "m2", name: "Dan Novak", former: false },
    ]);
  });

  it("lists the people behind those memberships, by the uid an entry's actor carries", async () => {
    server.use(rosterOf(ALICE, DAN));

    const { actors } = await memberRoster("g1");

    expect(actors).toEqual([
      { ref: "u1", name: "Alice Johnson", former: false },
      { ref: "u2", name: "Dan Novak", former: false },
    ]);
  });

  it("marks a member who has left, in both pickers", async () => {
    server.use(rosterOf(ALICE, { ...DAN, isActive: false, dateLeft: "2026-02-01T10:00:00" }));

    const { members, actors } = await memberRoster("g1");

    expect(members.at(-1)).toEqual({ ref: "m2", name: "Dan Novak", former: true });
    expect(actors.at(-1)).toEqual({ ref: "u2", name: "Dan Novak", former: true });
  });

  it("leaves a membership out of the actors when no user came back with it", async () => {
    server.use(
      rosterOf(ALICE, { uid: "m4", role: "GROUP_MEMBER", isActive: true, user: { name: "Nina" } }),
    );

    const { members, actors } = await memberRoster("g1");

    expect(members.map((member) => member.name)).toEqual(["Alice Johnson", "Nina"]);
    expect(actors).toEqual([{ ref: "u1", name: "Alice Johnson", former: false }]);
  });

  it("leaves out a membership with nothing to call it, which nothing could pick", async () => {
    server.use(rosterOf(ALICE, { uid: "m3", role: "GROUP_MEMBER", isActive: true }));

    const { names, members } = await memberRoster("g1");

    expect(members).toEqual([{ ref: "m1", name: "Alice Johnson", former: false }]);
    expect(names.m3).toBeUndefined();
  });

  it("costs the picker and nothing else when the roster will not load", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1/members`, () =>
        HttpResponse.json({ success: false, message: "Nope", data: null }, { status: 500 }),
      ),
    );

    expect(await memberRoster("g1")).toEqual({ names: {}, members: [], actors: [] });
  });
});
