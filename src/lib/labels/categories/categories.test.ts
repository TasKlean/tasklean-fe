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
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/labels/categories/categories";

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

describe("getCategories", () => {
  it("scopes the list by the path, not by a groupId parameter", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/g1/categories`, ({ request }) => {
        seen.url = request.url;
        return envelope([{ id: 7, name: "Kitchen" }]);
      }),
    );

    const categories = await getCategories("g1");

    expect(new URL(seen.url ?? "").search).toBe("");
    expect(categories.map((category) => category.id)).toEqual([7]);
  });

  it("answers with an empty list when the envelope carried no array", async () => {
    server.use(http.get(`${BASE}/api/groups/g1/categories`, () => envelope(null)));

    await expect(getCategories("g1")).resolves.toEqual([]);
  });
});

describe("createCategory", () => {
  it("names the group in the body, since the path carries none", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/categories`, async ({ request }) => {
        seen.body = await request.json();
        return envelope({ id: 7 });
      }),
    );

    await createCategory({ groupUid: "g1", name: "Kitchen", color: "#43aa8b" });

    expect(seen.body).toEqual({ groupUid: "g1", name: "Kitchen", color: "#43aa8b" });
  });
});

describe("updateCategory", () => {
  it("addresses the category by a numeric id in the path", async () => {
    const seen: Seen = {};
    server.use(
      http.put(`${BASE}/api/categories/7`, async ({ request }) => {
        seen.method = request.method;
        seen.body = await request.json();
        return envelope({ id: 7 });
      }),
    );

    await updateCategory(7, { name: "Kitchen", color: "#43aa8b", icon: "bath" });

    expect(seen.method).toBe("PUT");
    expect(seen.body).toEqual({ name: "Kitchen", color: "#43aa8b", icon: "bath" });
  });
});

describe("deleteCategory", () => {
  it("deletes by the same numeric id", async () => {
    const seen: Seen = {};
    server.use(
      http.delete(`${BASE}/api/categories/7`, ({ request }) => {
        seen.method = request.method;
        return envelope(null);
      }),
    );

    await deleteCategory(7);

    expect(seen.method).toBe("DELETE");
  });
});
