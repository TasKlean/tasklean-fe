import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

import { isMobileDevice, listMyDevices, logoutDevice, removeDevice } from "@/lib/devices/devices";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

function devicesHandler(data: unknown, seen?: { headers?: Headers }) {
  return http.get(`${BASE}/api/devices`, ({ request }) => {
    if (seen) seen.headers = request.headers;
    return HttpResponse.json({ success: true, message: null, data });
  });
}

describe("listMyDevices", () => {
  it("sends the device id, without which no row is the current one", async () => {
    const seen: { headers?: Headers } = {};
    server.use(devicesHandler([], seen));

    await listMyDevices();

    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
    expect(seen.headers?.get("x-device-user-agent")).toBe("Vitest UA");
  });

  it("puts this browser first, whatever order the backend used", async () => {
    server.use(
      devicesHandler([
        { id: 1, deviceName: "Firefox on Linux", lastUsed: "2026-10-14T10:00:00" },
        {
          id: 2,
          deviceName: "Chrome on Windows",
          lastUsed: "2026-01-01T10:00:00",
          currentDevice: true,
        },
      ]),
    );

    const devices = await listMyDevices();

    expect(devices.map((device) => device.id)).toEqual([2, 1]);
  });

  it("orders the rest by most recent use", async () => {
    server.use(
      devicesHandler([
        { id: 1, lastUsed: "2026-02-01T10:00:00" },
        { id: 2, lastUsed: "2026-10-01T10:00:00" },
        { id: 3, lastUsed: "2026-06-01T10:00:00" },
      ]),
    );

    const devices = await listMyDevices();

    expect(devices.map((device) => device.id)).toEqual([2, 3, 1]);
  });

  it("sinks a device with no readable last use rather than floating it", async () => {
    server.use(devicesHandler([{ id: 1 }, { id: 2, lastUsed: "2026-02-01T10:00:00" }]));

    const devices = await listMyDevices();

    expect(devices.map((device) => device.id)).toEqual([2, 1]);
  });

  it("survives a body that is not a list", async () => {
    server.use(devicesHandler(null));

    await expect(listMyDevices()).resolves.toEqual([]);
  });
});

describe("isMobileDevice", () => {
  it("reads the user-agent parser's own value", () => {
    expect(isMobileDevice({ deviceType: "mobile" })).toBe(true);
    expect(isMobileDevice({ deviceType: "desktop" })).toBe(false);
  });

  it("reads the values push registration writes, whatever their case", () => {
    expect(isMobileDevice({ deviceType: "ANDROID" })).toBe(true);
    expect(isMobileDevice({ deviceType: "IOS" })).toBe(true);
    expect(isMobileDevice({ deviceType: "WEB" })).toBe(false);
  });

  it("stays neutral about a type it does not know", () => {
    expect(isMobileDevice({ deviceType: "toaster" })).toBe(false);
    expect(isMobileDevice({})).toBe(false);
  });
});

describe("logoutDevice", () => {
  it("posts to the device's logout route with the device headers", async () => {
    const seen: { url?: string; headers?: Headers } = {};
    server.use(
      http.post(`${BASE}/api/devices/7/logout`, ({ request }) => {
        seen.url = request.url;
        seen.headers = request.headers;
        return HttpResponse.json({ success: true, message: "Device logged out", data: null });
      }),
    );

    await logoutDevice(7);

    expect(seen.url).toContain("/api/devices/7/logout");
    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
  });

  it("lets the backend's refusal through", async () => {
    server.use(
      http.post(`${BASE}/api/devices/7/logout`, () =>
        HttpResponse.json({ success: false, message: "Device not found" }, { status: 404 }),
      ),
    );

    await expect(logoutDevice(7)).rejects.toThrow("Device not found");
  });
});

describe("removeDevice", () => {
  it("deletes the device", async () => {
    const seen: { method?: string } = {};
    server.use(
      http.delete(`${BASE}/api/devices/9`, ({ request }) => {
        seen.method = request.method;
        return HttpResponse.json({ success: true, message: "Device removed", data: null });
      }),
    );

    await removeDevice(9);

    expect(seen.method).toBe("DELETE");
  });
});
