import { describe, expect, it } from "vitest";
import { themeAttribute } from "@/lib/preferences/theme-attribute";

describe("themeAttribute", () => {
  it("names the scheme for an explicit choice", () => {
    expect(themeAttribute("LIGHT")).toBe("light");
    expect(themeAttribute("DARK")).toBe("dark");
  });

  it("names nothing for the device's own setting, leaving the media query in charge", () => {
    expect(themeAttribute("SYSTEM")).toBeUndefined();
  });
});
