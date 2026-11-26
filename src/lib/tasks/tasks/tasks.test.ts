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
  archiveTask,
  createTask,
  deleteTask,
  getBoard,
  getTask,
  updateTask,
} from "@/lib/tasks/tasks/tasks";

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

describe("getBoard", () => {
  it("scopes the board by the path, the way a group's labels are scoped", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, ({ request }) => {
        seen.url = request.url;
        return envelope({ items: [], page: 0, totalPages: 0, totalTasks: 0 });
      }),
    );

    await getBoard("g1");

    expect(new URL(seen.url ?? "").search).toBe("");
  });

  it("sends a repeated key per status rather than one joined value", async () => {
    const seen: Seen = {};
    server.use(
      http.get(`${BASE}/api/groups/g1/tasks`, ({ request }) => {
        seen.url = request.url;
        return envelope({ items: [] });
      }),
    );

    await getBoard("g1", { status: ["TODO", "COMPLETED"] });

    expect(new URL(seen.url ?? "").searchParams.getAll("status")).toEqual(["TODO", "COMPLETED"]);
  });

  it("escapes a uid rather than pasting it into the path", async () => {
    server.use(http.get(`${BASE}/api/groups/a%2Fb/tasks`, () => envelope({ items: [] })));

    await expect(getBoard("a/b")).resolves.toBeDefined();
  });
});

describe("getTask", () => {
  it("reads one task by its own uid, not its group's", async () => {
    server.use(http.get(`${BASE}/api/tasks/t1`, () => envelope({ uid: "t1", name: "Floor" })));

    await expect(getTask("t1")).resolves.toMatchObject({ uid: "t1" });
  });
});

describe("createTask", () => {
  it("posts the task with the group named in the body", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/tasks`, async ({ request }) => {
        seen.body = await request.json();
        return envelope({ uid: "t1" });
      }),
    );

    await createTask({ groupUid: "g1", name: "Floor", priority: "HIGH" });

    expect(seen.body).toEqual({ groupUid: "g1", name: "Floor", priority: "HIGH" });
  });
});

describe("updateTask", () => {
  it("puts the task as it will then be, addressed by its uid", async () => {
    const seen: Seen = {};
    server.use(
      http.put(`${BASE}/api/tasks/t1`, async ({ request }) => {
        seen.method = request.method;
        seen.body = await request.json();
        return envelope({ uid: "t1" });
      }),
    );

    await updateTask("t1", { name: "Floor", priority: "LOW" });

    expect(seen.method).toBe("PUT");
    expect(seen.body).toEqual({ name: "Floor", priority: "LOW" });
  });
});

describe("archiveTask", () => {
  it("posts to the task's own archive path, carrying no body", async () => {
    const seen: Seen = {};
    server.use(
      http.post(`${BASE}/api/tasks/t1/archive`, async ({ request }) => {
        seen.body = await request.text();
        return envelope({ uid: "t1", status: "ARCHIVED" });
      }),
    );

    await expect(archiveTask("t1")).resolves.toMatchObject({ status: "ARCHIVED" });
    expect(seen.body).toBe("");
  });
});

describe("deleteTask", () => {
  it("deletes by uid", async () => {
    const seen: Seen = {};
    server.use(
      http.delete(`${BASE}/api/tasks/t1`, ({ request }) => {
        seen.method = request.method;
        return envelope(null);
      }),
    );

    await deleteTask("t1");

    expect(seen.method).toBe("DELETE");
  });
});
