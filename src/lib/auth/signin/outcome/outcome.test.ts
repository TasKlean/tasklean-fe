import { describe, expect, it } from "vitest";
import { signInOutcome } from "@/lib/auth/signin/outcome/outcome";

describe("signInOutcome", () => {
  it("maps a token pair onto our own field names", () => {
    expect(
      signInOutcome({ token: "at-1", refreshToken: "rt-1", uid: "u-1", name: "Ada" }, "Login"),
    ).toEqual({
      kind: "session",
      tokens: { accessToken: "at-1", refreshToken: "rt-1", userUid: "u-1", name: "Ada" },
    });
  });

  it("tolerates a missing uid, which openapi.json does not mark required", () => {
    expect(signInOutcome({ token: "at-1", refreshToken: "rt-1" }, "Login")).toMatchObject({
      tokens: { userUid: "" },
    });
  });

  it("reads the challenge before it reads the token", () => {
    expect(
      signInOutcome(
        { twoFactorRequired: true, challengeToken: "challenge-1", token: "at-1" },
        "Login",
      ),
    ).toEqual({ kind: "challenge", challengeToken: "challenge-1" });
  });

  it("takes the pair when the flag is false", () => {
    expect(
      signInOutcome(
        { twoFactorRequired: false, token: "at-1", refreshToken: "rt-1", uid: "u-1" },
        "Login",
      ),
    ).toMatchObject({ kind: "session" });
  });

  it.each([
    ["an empty challenge token", { twoFactorRequired: true, challengeToken: "" }],
    ["no challenge token at all", { twoFactorRequired: true }],
  ])("throws on a gated response with %s", (_label, response) => {
    expect(() => signInOutcome(response, "Login")).toThrow("Login needs a second factor");
  });

  it.each([
    ["no refresh token", { token: "at-1" }],
    ["no access token", { refreshToken: "rt-1" }],
    ["nothing", {}],
    ["nothing at all", undefined],
  ])("throws on a response carrying %s", (_label, response) => {
    expect(() => signInOutcome(response, "Google sign-in")).toThrow(
      "Google sign-in succeeded but returned no token pair.",
    );
  });
});
