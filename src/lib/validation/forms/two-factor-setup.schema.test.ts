import { describe, expect, it } from "vitest";
import { parseTwoFactorSetup } from "@/lib/validation/forms/two-factor-setup.schema";

describe("parseTwoFactorSetup", () => {
  it("accepts a password as typed, spaces included", () => {
    expect(parseTwoFactorSetup({ password: " Chores12! " })).toEqual({
      ok: true,
      values: { password: " Chores12! " },
    });
  });

  it("accepts no password, which a Google-only account cannot give", () => {
    expect(parseTwoFactorSetup({})).toEqual({ ok: true, values: {} });
  });
});
