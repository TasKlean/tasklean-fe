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
  memberNames,
  namesForPage,
  subjectName,
} from "@/app/(app)/app/groups/[uid]/overview/activity/page.helpers";
import type { AuditEntry, AuditNames } from "@/lib/audit/audit.types";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

function roleChanged(ref: string): AuditEntry {
  return { uid: "a1", action: "ROLE_CHANGED", entity: { type: "GROUP_MEMBER", ref } };
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

const NAMES: AuditNames = {
  m2: { name: "Dan Novak", userUid: "u2" },
  m1: { name: "Alice Johnson", userUid: "u1" },
};

describe("subjectName", () => {
  it("names the membership the feed is pinned to", () => {
    expect(subjectName("g1", { type: "member", ref: "m2" }, "Flat 2B", NAMES)).toBe("Dan Novak");
  });

  it("will not label another group's ref with this group's name", () => {
    expect(subjectName("g1", { type: "group", ref: "g1" }, "Flat 2B", NAMES)).toBe("Flat 2B");
    expect(subjectName("g1", { type: "group", ref: "g9" }, "Flat 2B", NAMES)).toBeNull();
  });

  it("names nothing for a kind no screen can resolve", () => {
    expect(subjectName("g1", { type: "task", ref: "t1" }, "Flat 2B", NAMES)).toBeNull();
  });
});

describe("namesForPage", () => {
  it("names a membership the roster no longer holds, which is everyone who has left", async () => {
    server.use(
      rosterOf(ALICE),
      http.get(`${BASE}/api/group-members/m9`, () =>
        envelope({
          uid: "m9",
          role: "GROUP_MEMBER",
          isActive: false,
          user: { uid: "u9", name: "Dan", lastName: "Novak" },
        }),
      ),
    );

    const names = await namesForPage([roleChanged("m9")], await memberNames("g1"));

    expect(names.m9).toEqual({ name: "Dan Novak", userUid: "u9" });
    expect(names.m1?.name).toBe("Alice Johnson");
  });

  it("asks for nothing when the roster already named every row", async () => {
    let asked = false;
    server.use(
      rosterOf(ALICE),
      http.get(`${BASE}/api/group-members/:uid`, () => {
        asked = true;
        return envelope(ALICE);
      }),
    );

    const names = await namesForPage([roleChanged("m1")], await memberNames("g1"));

    expect(asked).toBe(false);
    expect(names.m1?.name).toBe("Alice Johnson");
  });

  it("leaves a row without a name rather than failing when the membership will not read", async () => {
    server.use(
      rosterOf(ALICE),
      http.get(`${BASE}/api/group-members/m9`, () =>
        HttpResponse.json({ success: false, message: "Not yours", data: null }, { status: 403 }),
      ),
    );

    const names = await namesForPage([roleChanged("m9")], await memberNames("g1"));

    expect(names.m9).toBeUndefined();
  });

  it("ignores a row that is not about a membership", async () => {
    server.use(rosterOf(ALICE));

    const task: AuditEntry = { uid: "a2", action: "UPDATE", entity: { type: "TASK", ref: "t1" } };
    const names = await namesForPage([task], await memberNames("g1"));

    expect(names).toEqual({ m1: { name: "Alice Johnson", userUid: "u1" } });
  });
});
