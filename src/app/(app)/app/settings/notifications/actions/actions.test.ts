import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("@/lib/auth/session/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

import {
  type NotificationsActionState,
  saveNotificationsAction,
} from "@/app/(app)/app/settings/notifications/actions/actions";

const BASE = "http://api.test";

const PATH = `${BASE}/api/notification-settings`;

const EMPTY: NotificationsActionState = { error: null };

type Entry = { type: string; inApp: boolean; email: boolean };

const SAVED: Entry[] = [
  { type: "TASK_ASSIGNED", inApp: true, email: true },
  { type: "TASK_COMPLETED", inApp: true, email: false },
  { type: "TASK_REMINDER", inApp: false, email: false },
  { type: "MEMBER_JOINED", inApp: true, email: true },
];

const batches: Entry[][] = [];

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  batches.length = 0;
  server.use(
    http.put(`${PATH}/batch`, async ({ request }) => {
      const body = (await request.json()) as { settings: Entry[] };
      batches.push(body.settings);
      const written = new Map(body.settings.map((entry) => [entry.type, entry]));
      return HttpResponse.json({
        success: true,
        message: null,
        data: SAVED.map((entry) => written.get(entry.type) ?? entry),
      });
    }),
  );
});

function form(fields: Record<string, string[]>) {
  const data = new FormData();
  for (const [name, values] of Object.entries(fields)) {
    for (const value of values) data.append(name, value);
  }
  return data;
}

describe("saveNotificationsAction", () => {
  it("sends one batch, carrying every type the form reported", async () => {
    const state = await saveNotificationsAction(
      EMPTY,
      form({
        inApp: ["TASK_ASSIGNED", "TASK_COMPLETED", "MEMBER_JOINED"],
        email: ["TASK_ASSIGNED", "TASK_COMPLETED", "MEMBER_JOINED"],
      }),
    );

    expect(batches).toEqual([
      [
        { type: "TASK_ASSIGNED", inApp: true, email: true },
        { type: "TASK_COMPLETED", inApp: true, email: true },
        { type: "TASK_REMINDER", inApp: false, email: false },
        { type: "MEMBER_JOINED", inApp: true, email: true },
      ],
    ]);
    expect(state.done).toBe(true);
  });

  it("reads nothing before or after the write", async () => {
    await saveNotificationsAction(EMPTY, form({ inApp: [], email: [] }));

    expect(batches).toHaveLength(1);
  });

  it("answers with the matrix the backend read back", async () => {
    const state = await saveNotificationsAction(EMPTY, form({ inApp: [], email: [] }));

    expect(state.settings).toEqual({
      TASK_ASSIGNED: { inApp: false, email: false },
      TASK_COMPLETED: { inApp: false, email: false },
      TASK_REMINDER: { inApp: false, email: false },
      MEMBER_JOINED: { inApp: false, email: false },
    });
  });

  it("sends a type off as an entry, not by leaving it out", async () => {
    await saveNotificationsAction(
      EMPTY,
      form({ inApp: ["TASK_REMINDER"], email: ["TASK_REMINDER"] }),
    );

    expect(batches[0]).toContainEqual({ type: "MEMBER_JOINED", inApp: false, email: false });
  });

  it("refuses a type the backend does not have, without calling it", async () => {
    const state = await saveNotificationsAction(
      EMPTY,
      form({ inApp: ["GROUP_DELETED"], email: [] }),
    );

    expect(state.error).toBe("Something went wrong. Please try again.");
    expect(batches).toEqual([]);
  });

  it("reports a refused batch, which applied nothing", async () => {
    server.use(
      http.put(`${PATH}/batch`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "settings[0].email: Email preference is required",
            data: null,
          },
          { status: 400 },
        ),
      ),
    );

    const state = await saveNotificationsAction(EMPTY, form({ inApp: [], email: [] }));

    expect(state.error).toBe("settings[0].email: Email preference is required");
    expect(state.settings).toBeUndefined();
  });
});
