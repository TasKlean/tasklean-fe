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

import { createTag, deleteTag, getTags, updateTag } from "@/lib/labels/tags/tags";

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

describe("getTags", () => {
  it("scopes the list by the path, not by a groupId parameter", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/g1/tags`, ({ request }) => {
        seen.url = request.url;
        return envelope([{ id: 3, name: "Urgent" }]);
      }),
    );

    const tags = await getTags("g1");

    expect(new URL(seen.url ?? "").search).toBe("");
    expect(tags.map((tag) => tag.id)).toEqual([3]);
  });

  it("answers with an empty list when the envelope carried no array", async () => {
    server.use(http.get(`${BASE}/api/groups/g1/tags`, () => envelope(null)));

    await expect(getTags("g1")).resolves.toEqual([]);
  });
});

describe("createTag", () => {
  it("names the group in the body, since the path carries none", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/tags`, async ({ request }) => {
        seen.body = await request.json();
        return envelope({ id: 3 });
      }),
    );

    await createTag({ groupUid: "g1", name: "Urgent", color: "#e8505b" });

    expect(seen.body).toEqual({ groupUid: "g1", name: "Urgent", color: "#e8505b" });
  });
});

describe("updateTag", () => {
  it("carries the name as well as the colour, which is what a member reposts", async () => {
    const seen: Seen = {};
    server.use(
      http.put(`${BASE}/api/tags/3`, async ({ request }) => {
        seen.method = request.method;
        seen.body = await request.json();
        return envelope({ id: 3 });
      }),
    );

    await updateTag(3, { name: "Urgent", color: "#f9c74f" });

    expect(seen.method).toBe("PUT");
    expect(seen.body).toEqual({ name: "Urgent", color: "#f9c74f" });
  });
});

describe("deleteTag", () => {
  it("deletes by the same numeric id", async () => {
    const seen: Seen = {};
    server.use(
      http.delete(`${BASE}/api/tags/3`, ({ request }) => {
        seen.method = request.method;
        return envelope(null);
      }),
    );

    await deleteTag(3);

    expect(seen.method).toBe("DELETE");
  });
});
