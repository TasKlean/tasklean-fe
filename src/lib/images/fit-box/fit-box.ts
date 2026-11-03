/**
 * The size a picture should be drawn at to sit inside a square bound without
 * changing shape. Its own module because this is the half worth testing: jsdom
 * has no canvas, so the drawing around it cannot be.
 */

export type Box = {
  width: number;
  height: number;
};

/** Rounds to a whole pixel, never to none: a zero edge cannot be encoded. */
function atLeastOne(value: number): number {
  return Math.max(1, Math.round(value));
}

/**
 * Scales a size down to fit a square bound, never up.
 *
 * @param maxEdge The longest either edge may be, in pixels.
 * @returns The size to draw at. A picture already inside the bound keeps its
 * own size, and a size that is not a usable pair of numbers comes back as a
 * single pixel rather than as something a canvas will refuse.
 */
export function fitBox(width: number, height: number, maxEdge: number): Box {
  const longest = Math.max(width, height);

  if (!Number.isFinite(longest) || longest <= 0) return { width: 1, height: 1 };
  if (longest <= maxEdge) return { width: atLeastOne(width), height: atLeastOne(height) };

  const scale = maxEdge / longest;
  return { width: atLeastOne(width * scale), height: atLeastOne(height * scale) };
}
