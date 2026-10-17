import { describe, expect, it } from "vitest";
import { parseDeactivateAccount } from "@/lib/validation/forms/deactivate-account.schema";

describe("parseDeactivateAccount", () => {
  it("accepts a password as typed, spaces included", () => {
    expect(parseDeactivateAccount({ password: " Chores12! " })).toEqual({
      ok: true,
      values: { password: " Chores12! " },
    });
  });

  it("accepts no password, which a Google-only account cannot give", () => {
    expect(parseDeactivateAccount({})).toEqual({ ok: true, values: {} });
  });
});
