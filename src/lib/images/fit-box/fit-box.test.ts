import { describe, expect, it } from "vitest";
import { fitBox } from "@/lib/images/fit-box/fit-box";

describe("fitBox", () => {
  it("scales a landscape photo's long edge to the bound and keeps its shape", () => {
    expect(fitBox(4032, 3024, 1024)).toEqual({ width: 1024, height: 768 });
  });

  it("scales a portrait photo the same way", () => {
    expect(fitBox(3024, 4032, 1024)).toEqual({ width: 768, height: 1024 });
  });

  it("keeps a square square", () => {
    expect(fitBox(2000, 2000, 1024)).toEqual({ width: 1024, height: 1024 });
  });

  it("leaves a picture already inside the bound alone", () => {
    expect(fitBox(800, 600, 1024)).toEqual({ width: 800, height: 600 });
  });

  it("never scales a small picture up", () => {
    expect(fitBox(40, 30, 1024)).toEqual({ width: 40, height: 30 });
  });

  it("rounds a fractional edge", () => {
    expect(fitBox(1000, 333, 100)).toEqual({ width: 100, height: 33 });
  });

  it("gives a sliver one pixel rather than none", () => {
    expect(fitBox(2000, 3, 100)).toEqual({ width: 100, height: 1 });
  });

  it("falls back to a single pixel for a size that is not usable", () => {
    expect(fitBox(0, 0, 1024)).toEqual({ width: 1, height: 1 });
    expect(fitBox(Number.NaN, 100, 1024)).toEqual({ width: 1, height: 1 });
    expect(fitBox(-800, -600, 1024)).toEqual({ width: 1, height: 1 });
  });
});
