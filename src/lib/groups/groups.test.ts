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
import type { GroupQuery } from "@/lib/groups/filter/filter.types";
import {
  createGroup,
  deleteGroup,
  getGroup,
  getMyGroups,
  joinGroup,
  rotateInviteCode,
  searchMyGroups,
  updateGroup,
} from "@/lib/groups/groups";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

type Seen = { url?: string; method?: string; body?: unknown; headers?: Headers };

function envelope(data: unknown) {
  return HttpResponse.json({ success: true, message: null, data });
}

function watch(seen: Seen, request: Request): void {
  seen.url = request.url;
  seen.method = request.method;
  seen.headers = request.headers;
}

function askFor(fields: Partial<GroupQuery> = {}): GroupQuery {
  return { q: "", show: ["admin", "member"], sort: "name-asc", ...fields };
}

function sent(seen: Seen): URLSearchParams {
  return new URL(seen.url ?? "").searchParams;
}

describe("getMyGroups", () => {
  it("asks for the whole list and keeps the order it was answered in", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/mine`, ({ request }) => {
        watch(seen, request);
        return envelope([
          { uid: "g2", name: "Lake house" },
          { uid: "g1", name: "Flat 12" },
        ]);
      }),
    );

    const groups = await getMyGroups();

    expect(sent(seen).toString()).toBe("");
    expect(groups.map((group) => group.uid)).toEqual(["g2", "g1"]);
  });

  it("answers with an empty list when the envelope carried no array", async () => {
    server.use(http.get(`${BASE}/api/groups/mine`, () => envelope(null)));

    await expect(getMyGroups()).resolves.toEqual([]);
  });

  it("carries the device headers, like every authenticated call", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/mine`, ({ request }) => {
        watch(seen, request);
        return envelope([]);
      }),
    );

    await getMyGroups();

    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
  });
});

describe("searchMyGroups", () => {
  it("sends the search, the role and the order the list asked for", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/mine`, ({ request }) => {
        watch(seen, request);
        return envelope([]);
      }),
    );

    await searchMyGroups(askFor({ q: "beach", show: ["admin"], sort: "members-desc" }));

    expect(sent(seen).get("q")).toBe("beach");
    expect(sent(seen).getAll("role")).toEqual(["GROUP_ADMIN"]);
    expect(sent(seen).get("sort")).toBe("MEMBERS_DESC");
  });

  it("reads the plain list when nothing was asked of it", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/mine`, ({ request }) => {
        watch(seen, request);
        return envelope([{ uid: "g1", name: "Flat 12" }]);
      }),
    );

    const groups = await searchMyGroups(askFor());

    expect(sent(seen).toString()).toBe("");
    expect(groups).toHaveLength(1);
  });

  it("answers with an empty list when the envelope carried no array", async () => {
    server.use(http.get(`${BASE}/api/groups/mine`, () => envelope(null)));

    await expect(searchMyGroups(askFor({ q: "beach" }))).resolves.toEqual([]);
  });
});

describe("getGroup", () => {
  it("reads one group, carrying the caller's own role", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1`, () =>
        envelope({ uid: "g1", name: "Flat 12", myRole: "GROUP_ADMIN", memberCount: 4 }),
      ),
    );

    const group = await getGroup("g1");

    expect(group.myRole).toBe("GROUP_ADMIN");
    expect(group.memberCount).toBe(4);
  });

  it("encodes a uid that came from the URL", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/:uid`, ({ request }) => {
        watch(seen, request);
        return envelope({});
      }),
    );

    await getGroup("a/b");

    expect(seen.url).toBe(`${BASE}/api/groups/a%2Fb`);
  });

  it("leaves a 403 as an ApiError, since it is a permission and not the session", async () => {
    server.use(
      http.get(`${BASE}/api/groups/g1`, () =>
        HttpResponse.json({ success: false, message: "Access denied" }, { status: 403 }),
      ),
    );

    await expect(getGroup("g1")).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.status === 403,
    );
  });
});

describe("createGroup", () => {
  it("posts the name and description, and answers with the invite code", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/groups`, async ({ request }) => {
        watch(seen, request);
        seen.body = await request.json();
        return envelope({ uid: "g1", name: "Flat 12", inviteCode: "A1B2C3D4" });
      }),
    );

    const group = await createGroup({ name: "Flat 12", description: "The upstairs place" });

    expect(seen.body).toEqual({ name: "Flat 12", description: "The upstairs place" });
    expect(group.inviteCode).toBe("A1B2C3D4");
  });
});

describe("joinGroup", () => {
  it("posts the code and nothing else", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/groups/join`, async ({ request }) => {
        watch(seen, request);
        seen.body = await request.json();
        return envelope({ uid: "g1", name: "Flat 12", myRole: "GROUP_MEMBER" });
      }),
    );

    const group = await joinGroup("A1B2C3D4");

    expect(seen.body).toEqual({ inviteCode: "A1B2C3D4" });
    expect(group.myRole).toBe("GROUP_MEMBER");
  });

  it("leaves an unknown code as a 404 for the caller to phrase", async () => {
    server.use(
      http.post(`${BASE}/api/groups/join`, () =>
        HttpResponse.json({ success: false, message: "Invalid invite code" }, { status: 404 }),
      ),
    );

    await expect(joinGroup("A1B2C3D4")).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.status === 404,
    );
  });
});

describe("updateGroup", () => {
  it("puts the new details", async () => {
    const seen: Seen = {};
    server.use(
      http.put(`${BASE}/api/groups/g1`, async ({ request }) => {
        watch(seen, request);
        seen.body = await request.json();
        return envelope({ uid: "g1", name: "Flat 13" });
      }),
    );

    await updateGroup("g1", { name: "Flat 13" });

    expect(seen.method).toBe("PUT");
    expect(seen.body).toEqual({ name: "Flat 13" });
  });
});

describe("rotateInviteCode", () => {
  it("posts to the group's invite-code path and answers with the new one", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/groups/g1/invite-code`, ({ request }) => {
        watch(seen, request);
        return envelope({ uid: "g1", inviteCode: "E5F6G7H8" });
      }),
    );

    const group = await rotateInviteCode("g1");

    expect(seen.method).toBe("POST");
    expect(group.inviteCode).toBe("E5F6G7H8");
  });
});

describe("deleteGroup", () => {
  it("deletes the group", async () => {
    const seen: Seen = {};
    server.use(
      http.delete(`${BASE}/api/groups/g1`, ({ request }) => {
        watch(seen, request);
        return envelope(null);
      }),
    );

    await deleteGroup("g1");

    expect(seen.method).toBe("DELETE");
  });
});
