import { describe, expect, it } from "vitest";
import { encode } from "uqr";
import { encodeQr } from "@/lib/qr/qr-code/qr-code";

const RECT = /M(\d+) (\d+)h(\d+)v1h-\3z/g;

function drawn(path: string, size: number): boolean[][] {
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  for (const [, x, y, run] of path.matchAll(RECT)) {
    for (let step = 0; step < Number(run); step += 1) {
      const row = grid[Number(y)];
      if (row) row[Number(x) + step] = true;
    }
  }

  return grid;
}

describe("encodeQr", () => {
  it("sizes the grid in modules, the quiet zone included", () => {
    expect(encodeQr("HELLO").size).toBe(25);
  });

  it("grows the grid for text that needs more of it", () => {
    const short = encodeQr("HELLO");
    const uri = encodeQr(
      "otpauth://totp/TasKlean:a@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TasKlean",
    );

    expect(uri.size).toBeGreaterThan(short.size);
  });

  it("draws every dark module the encoder produced, and nothing else", () => {
    const text = "otpauth://totp/TasKlean:a@example.com?secret=JBSWY3DPEHPK3PXP";
    const expected = encode(text, { ecc: "L", border: 2 });

    const { size, path } = encodeQr(text);

    expect(drawn(path, size)).toEqual(expected.data);
  });

  it("merges a horizontal run into one rectangle", () => {
    const { path } = encodeQr("HELLO");

    const rectangles = [...path.matchAll(RECT)].length;
    const modules = encode("HELLO", { ecc: "L", border: 2 }).data.flat().filter(Boolean).length;

    expect(rectangles).toBeLessThan(modules);
    expect(path).toContain("h7v1h-7z");
  });

  it("keeps every rectangle inside the grid", () => {
    const { size, path } = encodeQr("HELLO");

    for (const [, x, y, run] of path.matchAll(RECT)) {
      expect(Number(y)).toBeLessThan(size);
      expect(Number(x) + Number(run)).toBeLessThanOrEqual(size);
    }
  });
});
