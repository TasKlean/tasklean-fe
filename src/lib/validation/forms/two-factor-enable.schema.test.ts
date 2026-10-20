import { describe, expect, it } from "vitest";
import {
  parseTwoFactorEnable,
  validateTwoFactorEnable,
} from "@/lib/validation/forms/two-factor-enable.schema";

describe("parseTwoFactorEnable", () => {
  it("accepts the six digits the app shows", () => {
    expect(parseTwoFactorEnable({ code: "123456" })).toEqual({
      ok: true,
      values: { code: "123456" },
    });
  });

  it("trims the surrounding space a paste brings with it", () => {
    expect(parseTwoFactorEnable({ code: " 123456 " })).toEqual({
      ok: true,
      values: { code: "123456" },
    });
  });

  it("refuses a recovery code, which cannot confirm a setup", () => {
    const result = parseTwoFactorEnable({ code: "AAAA1111" });

    expect(result.ok).toBe(false);
  });

  it("asks for the code when nothing was entered", () => {
    expect(validateTwoFactorEnable({ code: "" }).code).toBe("Enter the 6-digit code.");
  });

  it("asks for the rest of the digits when it is short", () => {
    expect(validateTwoFactorEnable({ code: "123" }).code).toBe("Enter all 6 digits.");
  });

  it("says nothing while the code is valid", () => {
    expect(validateTwoFactorEnable({ code: "123456" })).toEqual({});
  });
});
