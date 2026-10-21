import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw";

const clearSession = vi.fn(async () => {});
const getSession = vi.fn(async () => ({
  accessToken: "at-1",
  refreshToken: "rt-1",
  userUid: "u1",
  activeGroupId: null,
}));

vi.mock("@/lib/auth/session/session", () => ({
  clearSession: () => clearSession(),
  getSession: () => getSession(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => ({ name, value: "dev-1" }) }),
  headers: async () => new Headers({ "user-agent": "Vitest UA" }),
}));

import { logoutAction } from "@/app/(app)/actions/actions";

const BASE = "http://api.test";

beforeAll(() => {
  process.env.API_BASE_URL = BASE;
  process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
});

beforeEach(() => {
  clearSession.mockClear();
  getSession.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function revokeHandler(counter: { calls: number }, status = 200) {
  return http.post(`${BASE}/api/auth/logout`, () => {
    counter.calls += 1;
    return HttpResponse.json({ success: status === 200, message: null, data: null }, { status });
  });
}

async function redirectedTo(): Promise<string | undefined> {
  const thrown = await logoutAction().catch((error: unknown) => error);
  return String((thrown as { digest?: string }).digest).split(";")[2];
}

describe("logoutAction", () => {
  it("revokes the session at the backend", async () => {
    const counter = { calls: 0 };
    server.use(revokeHandler(counter));

    await redirectedTo();

    expect(counter.calls).toBe(1);
  });

  it("clears the cookie and returns to the public site", async () => {
    server.use(revokeHandler({ calls: 0 }));

    expect(await redirectedTo()).toBe("/");
    expect(clearSession).toHaveBeenCalled();
  });

  it("still signs the browser out when the backend refuses", async () => {
    server.use(revokeHandler({ calls: 0 }, 401));

    expect(await redirectedTo()).toBe("/");
    expect(clearSession).toHaveBeenCalled();
  });

  it("does not call the backend without a session", async () => {
    getSession.mockResolvedValue(null as never);

    expect(await redirectedTo()).toBe("/");
    expect(clearSession).toHaveBeenCalled();
  });
});

describe("logoutAction device binding", () => {
  it("tells the backend which device is leaving", async () => {
    getSession.mockResolvedValue({
      accessToken: "at-1",
      refreshToken: "rt-1",
      userUid: "u1",
      activeGroupId: null,
    });
    const seen: { headers?: Headers } = {};
    server.use(
      http.post(`${BASE}/api/auth/logout`, ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({ success: true, message: null, data: null });
      }),
    );

    await redirectedTo();

    expect(seen.headers?.get("x-device-id")).toBe("dev-1");
  });
});
