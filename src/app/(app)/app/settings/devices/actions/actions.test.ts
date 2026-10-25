import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const clearSession = vi.fn(async () => {});

vi.mock("@/lib/auth/session/session", () => ({
  clearSession: () => clearSession(),
  getSession: async () => ({
    accessToken: "at-1",
    refreshToken: "rt-1",
    userUid: "u1",
    activeGroupId: null,
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import {
  removeAllDevicesAction,
  removeDeviceAction,
  renameDeviceAction,
  signOutDeviceAction,
} from "@/app/(app)/app/settings/devices/actions/actions";

const BASE = "http://api.test";
const EMPTY = { error: null };

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

afterEach(() => {
  clearSession.mockClear();
});

function form(deviceId: string): FormData {
  const data = new FormData();
  data.set("deviceId", deviceId);
  return data;
}

function listing(devices: unknown[]) {
  return http.get(`${BASE}/api/devices`, () =>
    HttpResponse.json({ success: true, message: null, data: devices }),
  );
}

function ok(path: string, method: "post" | "delete" = "post") {
  return http[method](`${BASE}${path}`, () =>
    HttpResponse.json({ success: true, message: null, data: null }),
  );
}

describe("signOutDeviceAction on another device", () => {
  it("leaves this session alone", async () => {
    server.use(listing([{ id: 7, currentDevice: false }]), ok("/api/devices/7/logout"));

    await expect(signOutDeviceAction(EMPTY, form("7"))).resolves.toEqual({ error: null });
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("reports the backend's refusal rather than throwing", async () => {
    server.use(
      listing([{ id: 7, currentDevice: false }]),
      http.post(`${BASE}/api/devices/7/logout`, () =>
        HttpResponse.json({ success: false, message: "Device not found" }, { status: 404 }),
      ),
    );

    await expect(signOutDeviceAction(EMPTY, form("7"))).resolves.toEqual({
      error: "Device not found",
    });
  });

  it("refuses an id that is not one", async () => {
    await expect(signOutDeviceAction(EMPTY, form("not-a-number"))).resolves.toEqual({
      error: "Pick a device.",
    });
  });
});

describe("signOutDeviceAction on this device", () => {
  it("clears the cookie and sends them to sign in again", async () => {
    server.use(listing([{ id: 7, currentDevice: true }]), ok("/api/devices/7/logout"));

    await expect(signOutDeviceAction(EMPTY, form("7"))).rejects.toThrow(
      "REDIRECT:/login?signedOut=device",
    );
    expect(clearSession).toHaveBeenCalled();
  });

  it("keeps the session when the list cannot say which device is ours", async () => {
    server.use(
      http.get(`${BASE}/api/devices`, () =>
        HttpResponse.json({ success: false, message: "Nope" }, { status: 500 }),
      ),
      ok("/api/devices/7/logout"),
    );

    await expect(signOutDeviceAction(EMPTY, form("7"))).resolves.toEqual({ error: null });
    expect(clearSession).not.toHaveBeenCalled();
  });
});

describe("removeDeviceAction", () => {
  it("leaves this session alone for another device", async () => {
    server.use(listing([{ id: 9, currentDevice: false }]), ok("/api/devices/9", "delete"));

    await expect(removeDeviceAction(EMPTY, form("9"))).resolves.toEqual({ error: null });
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("signs out when the device removed was this one", async () => {
    server.use(listing([{ id: 9, currentDevice: true }]), ok("/api/devices/9", "delete"));

    await expect(removeDeviceAction(EMPTY, form("9"))).rejects.toThrow(
      "REDIRECT:/login?signedOut=device",
    );
    expect(clearSession).toHaveBeenCalled();
  });
});

describe("renameDeviceAction", () => {
  function renameForm(deviceId: string, name: string): FormData {
    const data = new FormData();
    data.set("deviceId", deviceId);
    data.set("name", name);
    return data;
  }

  it("sends the trimmed name and reports the save", async () => {
    const seen: { body?: unknown } = {};
    server.use(
      http.patch(`${BASE}/api/devices/7`, async ({ request }) => {
        seen.body = await request.json();
        return HttpResponse.json({ success: true, message: null, data: { id: 7 } });
      }),
    );

    const state = await renameDeviceAction(EMPTY, renameForm("7", "  Work laptop  "));

    expect(seen.body).toEqual({ name: "Work laptop" });
    expect(state).toEqual({ error: null, done: true });
  });

  it("refuses an empty name without calling the backend", async () => {
    const state = await renameDeviceAction(EMPTY, renameForm("7", "   "));

    expect(state.error).toBe("Enter a name for this device.");
    expect(state.done).toBeUndefined();
  });

  it("reports what the backend refused with", async () => {
    server.use(
      http.patch(`${BASE}/api/devices/7`, () =>
        HttpResponse.json(
          { success: false, message: "Device not found", data: null },
          { status: 404 },
        ),
      ),
    );

    const state = await renameDeviceAction(EMPTY, renameForm("7", "Work laptop"));

    expect(state.error).toBe("Device not found");
    expect(state.done).toBeUndefined();
  });
});

describe("removeAllDevicesAction", () => {
  it("clears this browser's session and sends them to sign in again", async () => {
    server.use(
      http.delete(`${BASE}/api/devices`, () =>
        HttpResponse.json({ success: true, message: "All devices removed", data: null }),
      ),
    );

    await expect(removeAllDevicesAction(EMPTY)).rejects.toThrow(
      "REDIRECT:/login?signedOut=devices",
    );
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it("keeps the session when the removal was refused", async () => {
    server.use(
      http.delete(`${BASE}/api/devices`, () =>
        HttpResponse.json({ success: false, message: "Nope", data: null }, { status: 500 }),
      ),
    );

    const state = await removeAllDevicesAction(EMPTY);

    expect(state.error).toBe("Nope");
    expect(clearSession).not.toHaveBeenCalled();
  });
});
