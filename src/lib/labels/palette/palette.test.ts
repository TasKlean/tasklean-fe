import { describe, expect, it } from "vitest";
import { DEFAULT_SWATCH, SWATCHES, swatchLabel } from "@/lib/labels/palette/palette";

const HEX = /^#[0-9a-f]{6}$/;

describe("SWATCHES", () => {
  it.each(SWATCHES)("offers $label as a hex code the backend accepts", ({ value }) => {
    expect(value).toMatch(HEX);
  });

  it("offers each colour once", () => {
    expect(new Set(SWATCHES.map((swatch) => swatch.value)).size).toBe(SWATCHES.length);
  });

  it("starts a label on one of its own swatches", () => {
    expect(SWATCHES.map((swatch) => swatch.value)).toContain(DEFAULT_SWATCH);
  });
});

describe("swatchLabel", () => {
  it("names a swatch however its case was stored", () => {
    expect(swatchLabel("#43AA8B")).toBe("Teal");
  });

  it("falls back to the code for a colour from outside the palette", () => {
    expect(swatchLabel("#123456")).toBe("#123456");
  });
});
