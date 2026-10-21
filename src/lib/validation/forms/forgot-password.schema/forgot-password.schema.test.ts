import { describe, expect, it } from "vitest";
import {
  echoForgotPassword,
  parseForgotPassword,
  validateForgotPassword,
} from "@/lib/validation/forms/forgot-password.schema/forgot-password.schema";

describe("parseForgotPassword", () => {
  it("trims the address", () => {
    expect(parseForgotPassword({ email: "  a@b.test  " })).toEqual({
      ok: true,
      values: { email: "a@b.test" },
    });
  });

  it("asks for an address when none was given", () => {
    expect(parseForgotPassword({})).toEqual({
      ok: false,
      errors: { email: "Enter your email address." },
    });
  });

  it("rejects a malformed address", () => {
    expect(parseForgotPassword({ email: "nope" })).toEqual({
      ok: false,
      errors: { email: "Enter a valid email address." },
    });
  });
});

describe("echoForgotPassword", () => {
  it("hands the rejected address back trimmed", () => {
    expect(echoForgotPassword({ email: "  nope  " })).toBe("nope");
  });

  it("returns an empty string when there is nothing to echo", () => {
    expect(echoForgotPassword({})).toBe("");
  });
});

describe("validateForgotPassword", () => {
  it("reports nothing for a valid address", () => {
    expect(validateForgotPassword({ email: "a@b.test" })).toEqual({});
  });

  it("reports the field for an invalid one", () => {
    expect(validateForgotPassword({ email: "nope" })).toEqual({
      email: "Enter a valid email address.",
    });
  });
});
