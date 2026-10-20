import { describe, expect, it } from "vitest";
import { parseTwoFactor, validateTwoFactor } from "@/lib/validation/forms/two-factor.schema";

function values(input: Record<string, string>) {
  const result = parseTwoFactor(input);
  return result.ok ? result.values : null;
}

describe("parseTwoFactor", () => {
  it("takes a six-digit authenticator code", () => {
    expect(values({ code: "123456" })?.code).toBe("123456");
  });

  it("strips the space an authenticator app shows", () => {
    expect(values({ code: "123 456" })?.code).toBe("123456");
  });

  it("normalises a recovery code the way the backend matches it", () => {
    expect(values({ code: "bxmb-jva7" })?.code).toBe("BXMBJVA7");
  });

  it("takes a recovery code typed without the hyphen", () => {
    expect(values({ code: "BXMBJVA7" })?.code).toBe("BXMBJVA7");
  });

  it("carries the next path through", () => {
    expect(values({ code: "123456", next: "/app/account" })?.next).toBe("/app/account");
  });

  it.each([
    ["nothing", ""],
    ["five digits", "12345"],
    ["seven digits", "1234567"],
    ["a seven-character recovery code", "bxmb-jv"],
    ["punctuation", "123.456"],
  ])("rejects %s", (_label, code) => {
    expect(parseTwoFactor({ code }).ok).toBe(false);
  });

  it("asks for a code when the field is empty", () => {
    const result = parseTwoFactor({ code: "" });

    expect(result.ok === false && result.errors.code).toBe("Enter your code.");
  });

  it("names both kinds of code when the shape is wrong", () => {
    const result = parseTwoFactor({ code: "12345" });

    expect(result.ok === false && result.errors.code).toBe(
      "Enter the 6 digits from your app, or a recovery code.",
    );
  });
});

describe("validateTwoFactor", () => {
  it("says nothing about a code that will be accepted", () => {
    expect(validateTwoFactor({ code: "123 456" })).toEqual({});
  });

  it("reports the field a form should mark", () => {
    expect(validateTwoFactor({ code: "12" }).code).toBeTruthy();
  });
});
