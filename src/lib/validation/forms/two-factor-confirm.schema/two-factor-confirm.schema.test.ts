import { describe, expect, it } from "vitest";
import {
  parseTwoFactorConfirm,
  validateTwoFactorConfirm,
} from "@/lib/validation/forms/two-factor-confirm.schema/two-factor-confirm.schema";

describe("parseTwoFactorConfirm", () => {
  it("accepts the six digits the app shows", () => {
    expect(parseTwoFactorConfirm({ password: "pw", code: "123456" })).toEqual({
      ok: true,
      values: { password: "pw", code: "123456" },
    });
  });

  it("accepts a recovery code, which this operation allows", () => {
    expect(parseTwoFactorConfirm({ password: "pw", code: "aaaa-1111" })).toEqual({
      ok: true,
      values: { password: "pw", code: "AAAA1111" },
    });
  });

  it("accepts no password, because a Google-only account has none", () => {
    expect(parseTwoFactorConfirm({ code: "123456" })).toEqual({
      ok: true,
      values: { password: undefined, code: "123456" },
    });
  });

  it("leaves the password exactly as it was typed", () => {
    const result = parseTwoFactorConfirm({ password: "  spaced  ", code: "123456" });

    expect(result.ok && result.values.password).toBe("  spaced  ");
  });

  it("refuses a code that is neither length", () => {
    expect(parseTwoFactorConfirm({ code: "1234" }).ok).toBe(false);
  });

  it("asks for the code when nothing was entered", () => {
    expect(validateTwoFactorConfirm({ code: "" }).code).toBe("Enter your code.");
  });

  it("says nothing while the code is valid", () => {
    expect(validateTwoFactorConfirm({ code: "AAAA1111" })).toEqual({});
  });
});
