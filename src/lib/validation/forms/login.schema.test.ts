import { describe, expect, it } from "vitest";
import { echoLogin, parseLogin, validateLogin } from "@/lib/validation/forms/login.schema";

describe("parseLogin", () => {
  it("trims the address but never the password", () => {
    const result = parseLogin({ email: "  a@b.test  ", password: "  secret  " });

    expect(result).toEqual({
      ok: true,
      values: { email: "a@b.test", password: "  secret  " },
    });
  });

  it("reports both fields when both are missing", () => {
    const result = parseLogin({});

    expect(result).toEqual({
      ok: false,
      errors: { email: "Enter your email address.", password: "Enter your password." },
    });
  });

  it("checks the password for presence only", () => {
    expect(parseLogin({ email: "a@b.test", password: "x" }).ok).toBe(true);
  });

  it("carries an optional next through", () => {
    const result = parseLogin({ email: "a@b.test", password: "x", next: " /tasks " });

    expect(result.ok && result.values.next).toBe("/tasks");
  });
});

describe("validateLogin", () => {
  it("returns nothing for a valid pair", () => {
    expect(validateLogin({ email: "a@b.test", password: "x" })).toEqual({});
  });

  it("returns one message per bad field", () => {
    expect(validateLogin({ email: "nope", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Enter your password.",
    });
  });
});

describe("echoLogin", () => {
  it("returns the trimmed address", () => {
    expect(echoLogin({ email: "  nope  " })).toBe("nope");
  });

  it("returns an empty string when there is nothing to echo", () => {
    expect(echoLogin({})).toBe("");
  });

  it("never returns the password", () => {
    expect(
      JSON.stringify(echoLogin({ email: "a@b.test", password: "secret-value" })),
    ).not.toContain("secret-value");
  });
});
