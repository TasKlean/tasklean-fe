import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DEVICE_COOKIE_NAME,
  buildDeviceHeaders,
  createDeviceId,
  deviceHeaders,
} from "@/lib/auth/device/device";

const HOP_SECRET = "device-test-hop-secret-at-least-32-chars";

const { cookieStore, headerList } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn() },
  headerList: { get: vi.fn() },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
  headers: vi.fn(async () => headerList),
}));

beforeAll(() => {
  process.env.API_BASE_URL = "http://api.test";
  process.env.SESSION_SECRET = "device-test-secret-at-least-32-chars";
  process.env.BFF_HOP_SECRET = HOP_SECRET;
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

afterEach(() => {
  vi.clearAllMocks();
});

function incoming(values: Record<string, string>) {
  headerList.get.mockImplementation((name: string) => values[name] ?? null);
}

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
  it("carries the id, the browser user agent and the end user's address", () => {
    expect(
      buildDeviceHeaders({
        deviceId: "device-1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0)",
        deviceIp: "203.0.113.7",
      }),
    ).toEqual({
      "X-Device-Id": "device-1",
      "X-Device-User-Agent": "Mozilla/5.0 (Windows NT 10.0)",
      "X-Device-Ip": "203.0.113.7",
      "X-Internal-Hop": HOP_SECRET,
    });
  });

  it("carries an IPv6 address", () => {
    expect(buildDeviceHeaders({ deviceIp: "2001:db8::1" })).toMatchObject({
      "X-Device-Ip": "2001:db8::1",
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

  it("vouches for nothing when there is no address", () => {
    expect(buildDeviceHeaders({ deviceId: "device-1" })["X-Internal-Hop"]).toBeUndefined();
  });

  it.each([
    ["a comma-joined chain", "1.2.3.4, 203.0.113.7"],
    ["a space-joined pair", "203.0.113.7 1.2.3.4"],
    ["one with a zone id", "fe80::1%eth0"],
    ["anything longer than an IPv6 literal", "2001:db8::1".padEnd(46, "0")],
    ["something that is not an address at all", "<script>"],
  ])("sends no address and no secret for %s", (_label, value) => {
    const built = buildDeviceHeaders({ deviceId: "device-1", deviceIp: value });

    expect(built["X-Device-Ip"]).toBeUndefined();
    expect(built["X-Internal-Hop"]).toBeUndefined();
  });
});

describe("deviceHeaders", () => {
  it("reads the cookie and the incoming request headers", async () => {
    cookieStore.get.mockReturnValue({ value: "device-7" });
    incoming({ "user-agent": "Mozilla/5.0 (Macintosh)", "cf-connecting-ip": "198.51.100.4" });

    await expect(deviceHeaders()).resolves.toEqual({
      "X-Device-Id": "device-7",
      "X-Device-User-Agent": "Mozilla/5.0 (Macintosh)",
      "X-Device-Ip": "198.51.100.4",
      "X-Internal-Hop": HOP_SECRET,
    });
    expect(cookieStore.get).toHaveBeenCalledWith(DEVICE_COOKIE_NAME);
  });

  it("takes no address from x-forwarded-for, whose leftmost entry a caller chooses", async () => {
    cookieStore.get.mockReturnValue({ value: "device-7" });
    incoming({ "x-forwarded-for": "1.2.3.4, 172.70.240.123" });

    await expect(deviceHeaders()).resolves.toEqual({ "X-Device-Id": "device-7" });
  });

  it("yields an empty bag when no device cookie has been minted", async () => {
    cookieStore.get.mockReturnValue(undefined);
    headerList.get.mockReturnValue(null);

    await expect(deviceHeaders()).resolves.toEqual({});
  });
});
