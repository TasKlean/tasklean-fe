import { describe, expect, it } from "vitest";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";

const EMPTY: LoginState = { error: null };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("loginAction validation", () => {
  it("rejects a malformed email without calling the API", async () => {
    const state = await loginAction(EMPTY, form({ email: "nope", password: "password123" }));

    expect(state.fieldErrors?.email).toBe("Enter a valid email address.");
    expect(state.fieldErrors?.password).toBeUndefined();
    expect(state.error).toBeNull();
  });

  it("rejects a missing password", async () => {
    const state = await loginAction(EMPTY, form({ email: "a@b.test", password: "" }));

    expect(state.fieldErrors?.password).toBe("Enter your password.");
    expect(state.fieldErrors?.email).toBeUndefined();
  });

  it("reports both fields at once", async () => {
    const state = await loginAction(EMPTY, form({ email: "", password: "" }));

    expect(state.fieldErrors?.email).toBe("Enter your email address.");
    expect(state.fieldErrors?.password).toBe("Enter your password.");
  });

  it("echoes the email back so a rejected submit keeps it", async () => {
    const state = await loginAction(EMPTY, form({ email: "  a@b.test  ", password: "" }));

    expect(state.email).toBe("a@b.test");
  });

  it("never echoes the password", async () => {
    const state = await loginAction(EMPTY, form({ email: "nope", password: "secret-value" }));

    expect(JSON.stringify(state)).not.toContain("secret-value");
  });
});
