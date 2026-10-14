import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEVICE_COOKIE_NAME,
  buildDeviceHeaders,
  createDeviceId,
  deviceHeaders,
} from "@/lib/auth/device";

const { cookieStore, headerList } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn() },
  headerList: { get: vi.fn() },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
  headers: vi.fn(async () => headerList),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("createDeviceId", () => {
  it("mints a uuid", () => {
    expect(createDeviceId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("mints a different id each time", () => {
    expect(createDeviceId()).not.toBe(createDeviceId());
  });
});

describe("buildDeviceHeaders", () => {
  it("carries the id, the browser user agent and the forwarded chain", () => {
    expect(
      buildDeviceHeaders({
        deviceId: "device-1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0)",
        forwardedFor: "203.0.113.7, 10.0.0.1",
      }),
    ).toEqual({
      "X-Device-Id": "device-1",
      "X-Device-User-Agent": "Mozilla/5.0 (Windows NT 10.0)",
      "X-Forwarded-For": "203.0.113.7, 10.0.0.1",
    });
  });

  it("omits what the request did not carry", () => {
    expect(buildDeviceHeaders({ deviceId: "device-1", userAgent: null })).toEqual({
      "X-Device-Id": "device-1",
    });
  });

  it("omits an empty id rather than sending a blank header", () => {
    expect(buildDeviceHeaders({ deviceId: "" })).toEqual({});
  });

  it("builds an empty bag from an empty source", () => {
    expect(buildDeviceHeaders({})).toEqual({});
  });
});

describe("deviceHeaders", () => {
  it("reads the cookie and the incoming request headers", async () => {
    cookieStore.get.mockReturnValue({ value: "device-7" });
    headerList.get.mockImplementation((name: string) =>
      name === "user-agent" ? "Mozilla/5.0 (Macintosh)" : "198.51.100.4",
    );

    await expect(deviceHeaders()).resolves.toEqual({
      "X-Device-Id": "device-7",
      "X-Device-User-Agent": "Mozilla/5.0 (Macintosh)",
      "X-Forwarded-For": "198.51.100.4",
    });
    expect(cookieStore.get).toHaveBeenCalledWith(DEVICE_COOKIE_NAME);
  });

  it("yields an empty bag when no device cookie has been minted", async () => {
    cookieStore.get.mockReturnValue(undefined);
    headerList.get.mockReturnValue(null);

    await expect(deviceHeaders()).resolves.toEqual({});
  });
});
