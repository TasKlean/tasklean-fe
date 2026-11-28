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

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import {
  labelSubjects,
  loadTrail,
  memberRoster,
  searchTasks,
  subjectName,
  taskSubjects,
  trailSubjects,
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

function boardOf(...items: unknown[]) {
  return http.get(`${BASE}/api/groups/g1/tasks`, () =>
    envelope({ items, totalTasks: items.length }),
  );
}

function labelsOf(categories: unknown[], tags: unknown[]) {
  return [
    http.get(`${BASE}/api/groups/g1/categories`, () => envelope(categories)),
    http.get(`${BASE}/api/groups/g1/tags`, () => envelope(tags)),
  ];
}

// Every read a view makes beyond the feed, so a test naming only the one it is
// about does not fail on an unhandled request.
function quietReads() {
  return [rosterOf(), boardOf(), ...labelsOf([], [])];
}

const BINS = { uid: "t1", name: "Bins" };

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
  "GROUP_MEMBER:m2": { name: "Dan Novak", userUid: "u2" },
  "GROUP_MEMBER:m1": { name: "Alice Johnson", userUid: "u1" },
  "TASK:t1": { name: "Bins" },
  "CATEGORY:3": { name: "Kitchen" },
  "TAG:3": { name: "weekly" },
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

  it("names the task, the category and the tag a feed is pinned to", () => {
    expect(subjectName("g1", filter({ type: "task", ref: "t1" }), "Flat 2B", NAMES)).toBe("Bins");
    expect(subjectName("g1", filter({ type: "category", ref: "3" }), "Flat 2B", NAMES)).toBe(
      "Kitchen",
    );
    expect(subjectName("g1", filter({ type: "tag", ref: "3" }), "Flat 2B", NAMES)).toBe("weekly");
  });

  it("names nothing for a ref no screen could resolve", () => {
    expect(subjectName("g1", filter({ type: "task", ref: "t9" }), "Flat 2B", NAMES)).toBeNull();
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
    expect(names["GROUP_MEMBER:m3"]).toBeUndefined();
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

describe("taskSubjects", () => {
  it("reads every state, newest first, so an archived task still reads by name", async () => {
    let asked = new URLSearchParams();
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, ({ request }) => {
        asked = new URL(request.url).searchParams;
        return envelope({ items: [BINS] });
      }),
    );

    const { names } = await taskSubjects("g1");

    expect(asked.getAll("status").sort()).toEqual(["ARCHIVED", "COMPLETED", "IN_PROGRESS", "TODO"]);
    expect(asked.get("sort")).toBe("CREATED_DESC");
    expect(names["TASK:t1"]?.name).toBe("Bins");
  });

  it("offers ten of them and names the rest", async () => {
    const many = Array.from({ length: 24 }, (_, index) => ({
      uid: `t${index}`,
      name: `Task ${index}`,
    }));
    server.use(boardOf(...many));

    const { names, tasks } = await taskSubjects("g1");

    expect(tasks).toHaveLength(10);
    expect(Object.keys(names)).toHaveLength(24);
  });

  it("costs the names and nothing else when the board will not load", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, () =>
        HttpResponse.json({ success: false, message: "Nope", data: null }, { status: 500 }),
      ),
    );

    expect(await taskSubjects("g1")).toEqual({ names: {}, tasks: [] });
  });
});

describe("labelSubjects", () => {
  it("keys a category and a tag apart, which number themselves separately", async () => {
    server.use(...labelsOf([{ id: 3, name: "Kitchen" }], [{ id: 3, name: "weekly" }]));

    const { names, categories, tags } = await labelSubjects("g1");

    expect(names["CATEGORY:3"]?.name).toBe("Kitchen");
    expect(names["TAG:3"]?.name).toBe("weekly");
    expect(categories).toEqual([{ ref: "3", name: "Kitchen" }]);
    expect(tags).toEqual([{ ref: "3", name: "weekly" }]);
  });

  it("keeps the list that did load when the other one did not", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1/categories`, () =>
        HttpResponse.json({ success: false, message: "Nope", data: null }, { status: 500 }),
      ),
      http.get(`${BASE}/api/groups/g1/tags`, () => envelope([{ id: 4, name: "weekly" }])),
    );

    const { categories, tags } = await labelSubjects("g1");

    expect(categories).toEqual([]);
    expect(tags).toEqual([{ ref: "4", name: "weekly" }]);
  });
});

describe("searchTasks", () => {
  it("sends the query to the endpoint and offers what came back", async () => {
    let asked: string | null = "";
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, ({ request }) => {
        asked = new URL(request.url).searchParams.get("q");
        return envelope({ items: [BINS] });
      }),
    );

    expect(await searchTasks("g1", "bin")).toEqual([{ ref: "t1", name: "Bins" }]);
    expect(asked).toBe("bin");
  });

  it("says nothing at all where the read would not load, which is not no matches", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, () =>
        HttpResponse.json({ success: false, message: "Nope", data: null }, { status: 500 }),
      ),
    );

    expect(await searchTasks("g1", "bin")).toBeNull();
  });

  it("sends no query at all for an empty box", async () => {
    let asked: string | null = "set";
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, ({ request }) => {
        asked = new URL(request.url).searchParams.get("q");
        return envelope({ items: [] });
      }),
    );

    await searchTasks("g1", "");

    expect(asked).toBeNull();
  });
});

describe("trailSubjects", () => {
  it("merges one name map out of every screen it read", async () => {
    server.use(rosterOf(DAN), boardOf(BINS), ...labelsOf([{ id: 3, name: "Kitchen" }], []));

    const subjects = await trailSubjects("g1");

    expect(Object.keys(subjects.names).sort()).toEqual([
      "CATEGORY:3",
      "GROUP_MEMBER:m2",
      "TASK:t1",
    ]);
    expect(subjects.tasks).toEqual([{ ref: "t1", name: "Bins" }]);
  });
});

describe("loadTrail", () => {
  function trail(status: number, message: string) {
    return http.get(`${BASE}/api/audit-logs/groups/g1`, () =>
      HttpResponse.json({ success: false, message, data: null }, { status }),
    );
  }

  it("reads the feed and everything that names its rows together", async () => {
    server.use(
      rosterOf(ALICE, DAN),
      boardOf(BINS),
      ...labelsOf([{ id: 3, name: "Kitchen" }], [{ id: 4, name: "weekly" }]),
      http.get(`${BASE}/api/audit-logs/groups/g1`, () =>
        envelope({ items: [], nextCursor: null, total: 0 }),
      ),
    );

    const view = await loadTrail("g1", filter(), "UTC");

    expect(view.failure).toBeNull();
    expect(view.subjects.names["GROUP_MEMBER:m2"]?.name).toBe("Dan Novak");
    expect(view.subjects.names["TASK:t1"]?.name).toBe("Bins");
    expect(view.subjects.names["CATEGORY:3"]?.name).toBe("Kitchen");
    expect(view.subjects.names["TAG:4"]?.name).toBe("weekly");
  });

  it("sends a reader whose session has gone back to the login screen", async () => {
    server.use(...quietReads(), trail(401, "Unauthorized"));

    await expect(loadTrail("g1", filter(), "UTC")).rejects.toThrow("REDIRECT:/login");
  });

  it("bounces a reader out of a group that is not theirs", async () => {
    server.use(...quietReads(), trail(403, "Forbidden"));

    await expect(loadTrail("g1", filter(), "UTC")).rejects.toThrow("REDIRECT:/app?unavailable=1");
  });

  it("reports the refusal of an actor filter rather than bouncing on it", async () => {
    server.use(...quietReads(), trail(403, "Forbidden"));

    const view = await loadTrail("g1", filter({ actor: "u2" }), "UTC");

    expect(view.failure).toBe("Forbidden");
    expect(view.page.entries).toEqual([]);
  });
});
