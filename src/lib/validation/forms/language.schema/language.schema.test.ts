import { describe, expect, it } from "vitest";
import { parseLanguage } from "@/lib/validation/forms/language.schema/language.schema";

describe("parseLanguage", () => {
  it("accepts each language the app supports", () => {
    expect(parseLanguage({ locale: "EN" })).toEqual({ ok: true, values: { locale: "EN" } });
    expect(parseLanguage({ locale: "DE" })).toEqual({ ok: true, values: { locale: "DE" } });
    expect(parseLanguage({ locale: "SL" })).toEqual({ ok: true, values: { locale: "SL" } });
  });

  it("refuses a language the backend does not store", () => {
    expect(parseLanguage({ locale: "FR" })).toEqual({
      ok: false,
      errors: { locale: "Pick a language." },
    });
  });
});
