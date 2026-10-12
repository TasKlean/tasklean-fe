import { describe, expect, it } from "vitest";
import { parseGoogleSignIn } from "@/lib/validation/forms/google-signin.schema";

describe("parseGoogleSignIn", () => {
  it("accepts a credential and keeps the next path", () => {
    const result = parseGoogleSignIn({ idToken: "token", next: "/groups" });

    expect(result).toEqual({ ok: true, values: { idToken: "token", next: "/groups" } });
  });

  it("accepts a credential with no next path", () => {
    const result = parseGoogleSignIn({ idToken: "token" });

    expect(result.ok).toBe(true);
  });

  it("rejects an empty credential", () => {
    const result = parseGoogleSignIn({ idToken: "" });

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.errors.idToken).toBe(
      "Google sign-in did not complete. Please try again.",
    );
  });

  it("rejects a missing credential", () => {
    const result = parseGoogleSignIn({});

    expect(result.ok).toBe(false);
  });
});
