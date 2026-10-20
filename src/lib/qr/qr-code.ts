/**
 * Turns text into the geometry of a QR code. Server side on purpose: the
 * encoder stays out of the browser bundle, and one path string travels to the
 * client instead of a few thousand booleans.
 */

import "server-only";

import { encode } from "uqr";
import type { QrCode } from "@/lib/qr/qr-code.types";

// Modules of quiet zone. Fewer than the spec's four, with the surface the code
// sits on making up the rest.
const BORDER = 2;

/**
 * Encodes text as a QR code.
 *
 * @returns Its size in modules, and a path whose runs of dark modules are
 * merged so the string stays small.
 */
export function encodeQr(text: string): QrCode {
  // Lowest correction level, which keeps the grid coarse. This is read off a
  // screen by a camera, where a bigger module beats spare redundancy.
  const { size, data } = encode(text, { ecc: "L", border: BORDER });
  const parts: string[] = [];

  for (let y = 0; y < size; y += 1) {
    const row = data[y] ?? [];
    let x = 0;

    while (x < size) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let run = 1;
      while (row[x + run]) run += 1;
      parts.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }

  return { size, path: parts.join("") };
}
