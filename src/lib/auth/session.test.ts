import { EncryptJWT } from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  type Session,
  clearSession,
  getSession,
  sealSession,
  setSession,
  unsealSession,
} from "@/lib/auth/session";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

const SECRET = "test-session-secret-at-least-32-chars";

const session: Session = {
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  userUid: "user-uid-1",
  activeGroupId: 3,
};

async function realKey(): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SECRET));
  return new Uint8Array(digest);
}

beforeAll(() => {
  process.env.API_BASE_URL = "http://api.test";
  process.env.SESSION_SECRET = SECRET;
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id.apps.googleusercontent.com";
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("sealSession / unsealSession", () => {
  it("round-trips a session", async () => {
    await expect(unsealSession(await sealSession(session))).resolves.toEqual(session);
  });

  it("encrypts rather than signs — the tokens are not readable in the cookie", async () => {
    const sealed = await sealSession(session);

    expect(sealed).not.toContain(session.accessToken);
    expect(sealed).not.toContain(session.refreshToken);
    expect(sealed).not.toContain(btoa(session.accessToken).replace(/=+$/, ""));

    const decodedParts = sealed
      .split(".")
      .map((part) => {
        try {
          return atob(part.replace(/-/g, "+").replace(/_/g, "/"));
        } catch {
          return "";
        }
      })
      .join("");
    expect(decodedParts).not.toContain("refresh-token-value");
  });

  it("keeps a null activeGroupId", async () => {
    const withoutGroup = { ...session, activeGroupId: null };
    await expect(unsealSession(await sealSession(withoutGroup))).resolves.toEqual(withoutGroup);
  });

  it("does not leak the JWT's own iat/exp claims into the Session", async () => {
    const result = await unsealSession(await sealSession(session));
    expect(Object.keys(result ?? {}).sort()).toEqual(
      ["accessToken", "activeGroupId", "refreshToken", "userUid"].sort(),
    );
  });

  it.each([undefined, null, ""])("returns null for %j", async (token) => {
    await expect(unsealSession(token)).resolves.toBeNull();
  });

  it("returns null for a non-token string", async () => {
    await expect(unsealSession("not-a-jwt")).resolves.toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const sealed = await sealSession(session);
    const tampered = `${sealed.slice(0, -4)}AAAA`;
    await expect(unsealSession(tampered)).resolves.toBeNull();
  });

  it("returns null for a token sealed with a different key", async () => {
    const foreignKey = crypto.getRandomValues(new Uint8Array(32));
    const forged = await new EncryptJWT({ ...session })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime("14d")
      .encrypt(foreignKey);

    await expect(unsealSession(forged)).resolves.toBeNull();
  });

  it("returns null for a correctly encrypted token whose payload is not a session", async () => {
    const forged = await new EncryptJWT({ accessToken: "only-this" })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime("14d")
      .encrypt(await realKey());

    await expect(unsealSession(forged)).resolves.toBeNull();
  });

  it("returns null once the 14-day expiry has passed", async () => {
    const sealed = await sealSession(session);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));

    await expect(unsealSession(sealed)).resolves.toBeNull();
  });

  it("is still valid just before expiry", async () => {
    const sealed = await sealSession(session);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 13 * 24 * 60 * 60 * 1000));

    await expect(unsealSession(sealed)).resolves.toEqual(session);
  });
});

describe("cookie handling", () => {
  it("writes an httpOnly, SameSite=Lax cookie scoped to the whole site", async () => {
    await setSession(session);

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, value, options] = cookieStore.set.mock.calls[0];

    expect(name).toBe("tasklean_session");
    expect(value).not.toContain(session.refreshToken);
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  });

  it("writes a value that unseals back to the session", async () => {
    await setSession(session);
    const [, value] = cookieStore.set.mock.calls[0];

    await expect(unsealSession(value)).resolves.toEqual(session);
  });

  it("reads the session back out of the cookie", async () => {
    cookieStore.get.mockReturnValue({ value: await sealSession(session) });

    await expect(getSession()).resolves.toEqual(session);
    expect(cookieStore.get).toHaveBeenCalledWith("tasklean_session");
  });

  it("returns null when there is no cookie", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(getSession()).resolves.toBeNull();
  });

  it("deletes the cookie by name on clear", async () => {
    await clearSession();

    expect(cookieStore.delete).toHaveBeenCalledWith("tasklean_session");
  });
});
