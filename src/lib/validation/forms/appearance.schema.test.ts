import { describe, expect, it } from "vitest";
import { parseAppearance } from "@/lib/validation/forms/appearance.schema";

describe("parseAppearance", () => {
  it("accepts each scheme the picker offers", () => {
    expect(parseAppearance({ theme: "SYSTEM" })).toEqual({ ok: true, values: { theme: "SYSTEM" } });
    expect(parseAppearance({ theme: "DARK" })).toEqual({ ok: true, values: { theme: "DARK" } });
    expect(parseAppearance({ theme: "LIGHT" })).toEqual({ ok: true, values: { theme: "LIGHT" } });
  });

  it("refuses a scheme the backend does not store", () => {
    expect(parseAppearance({ theme: "dark" })).toEqual({
      ok: false,
      errors: { theme: "Pick a theme." },
    });
  });

  it("refuses a missing scheme", () => {
    expect(parseAppearance({})).toEqual({ ok: false, errors: { theme: "Pick a theme." } });
  });
});
