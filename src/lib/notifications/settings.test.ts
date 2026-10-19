import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";
import { SessionExpiredError } from "@/lib/api/server";

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

import { getNotificationSettings, saveNotificationSettings } from "@/lib/notifications/settings";

const BASE = "http://api.test";

const PATH = `${BASE}/api/notification-settings`;

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

const SAVED = [
  { type: "TASK_ASSIGNED", inApp: true, email: false },
  { type: "TASK_COMPLETED", inApp: false, email: false },
  { type: "TASK_REMINDER", inApp: false, email: true },
  { type: "MEMBER_JOINED", inApp: true, email: true },
];

function answer(data: unknown, status = 200) {
  return http.get(PATH, () =>
    HttpResponse.json({ success: status === 200, message: null, data }, { status }),
  );
}

describe("getNotificationSettings", () => {
  it("keys every entry the backend reported by its type", async () => {
    server.use(
      answer([
        { type: "TASK_ASSIGNED", inApp: true, email: false },
        { type: "TASK_COMPLETED", inApp: false, email: false },
        { type: "TASK_REMINDER", inApp: false, email: true },
        { type: "MEMBER_JOINED", inApp: true, email: true },
      ]),
    );

    await expect(getNotificationSettings()).resolves.toEqual({
      TASK_ASSIGNED: { inApp: true, email: false },
      TASK_COMPLETED: { inApp: false, email: false },
      TASK_REMINDER: { inApp: false, email: true },
      MEMBER_JOINED: { inApp: true, email: true },
    });
  });

  it("answers for every type we offer, whatever the list held", async () => {
    server.use(answer([{ type: "TASK_REMINDER", inApp: false, email: false }]));

    await expect(getNotificationSettings()).resolves.toEqual({
      TASK_ASSIGNED: { inApp: true, email: true },
      TASK_COMPLETED: { inApp: true, email: true },
      TASK_REMINDER: { inApp: false, email: false },
      MEMBER_JOINED: { inApp: true, email: true },
    });
  });

  it("ignores a type it does not offer", async () => {
    server.use(answer([{ type: "GROUP_DELETED", inApp: false, email: false }]));

    const settings = await getNotificationSettings();

    expect(Object.keys(settings)).toEqual([
      "TASK_ASSIGNED",
      "TASK_COMPLETED",
      "TASK_REMINDER",
      "MEMBER_JOINED",
    ]);
  });

  it("falls back to the defaults when the payload is not a list", async () => {
    server.use(answer(null));

    await expect(getNotificationSettings()).resolves.toEqual({
      TASK_ASSIGNED: { inApp: true, email: true },
      TASK_COMPLETED: { inApp: true, email: true },
      TASK_REMINDER: { inApp: true, email: true },
      MEMBER_JOINED: { inApp: true, email: true },
    });
  });

  it("ends the session on a 401", async () => {
    server.use(answer(null, 401));

    await expect(getNotificationSettings()).rejects.toBeInstanceOf(SessionExpiredError);
  });
});

describe("saveNotificationSettings", () => {
  it("puts one batch, carrying only the entries it was given", async () => {
    const seen: { method?: string; body?: unknown } = {};
    server.use(
      http.put(`${PATH}/batch`, async ({ request }) => {
        seen.method = request.method;
        seen.body = await request.json();
        return HttpResponse.json({ success: true, message: null, data: SAVED });
      }),
    );

    await saveNotificationSettings([{ type: "TASK_REMINDER", inApp: false, email: true }]);

    expect(seen.method).toBe("PUT");
    expect(seen.body).toEqual({
      settings: [{ type: "TASK_REMINDER", inApp: false, email: true }],
    });
  });

  it("answers with the whole matrix the backend read back, not with what it sent", async () => {
    server.use(
      http.put(`${PATH}/batch`, () =>
        HttpResponse.json({ success: true, message: null, data: SAVED }),
      ),
    );

    await expect(
      saveNotificationSettings([{ type: "TASK_REMINDER", inApp: true, email: true }]),
    ).resolves.toEqual({
      TASK_ASSIGNED: { inApp: true, email: false },
      TASK_COMPLETED: { inApp: false, email: false },
      TASK_REMINDER: { inApp: false, email: true },
      MEMBER_JOINED: { inApp: true, email: true },
    });
  });

  it("reports a refused batch rather than guessing what was saved", async () => {
    server.use(
      http.put(`${PATH}/batch`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "typesDistinct: Each notification type may appear only once in a batch",
            data: null,
          },
          { status: 400 },
        ),
      ),
    );

    await expect(
      saveNotificationSettings([
        { type: "TASK_REMINDER", inApp: true, email: true },
        { type: "TASK_REMINDER", inApp: false, email: false },
      ]),
    ).rejects.toThrow("Each notification type may appear only once in a batch");
  });

  it("ends the session on a 401", async () => {
    server.use(
      http.put(`${PATH}/batch`, () =>
        HttpResponse.json({ success: false, message: null, data: null }, { status: 401 }),
      ),
    );

    await expect(
      saveNotificationSettings([{ type: "TASK_REMINDER", inApp: true, email: true }]),
    ).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
