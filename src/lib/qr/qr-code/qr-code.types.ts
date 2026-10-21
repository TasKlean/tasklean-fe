/**
 * The shape of an encoded QR code. Its own module, and deliberately without
 * `server-only`: the encoder is server side, but the component that draws the
 * result runs in the browser and needs the type.
 */

export type QrCode = {
  // Width and height in modules, the quiet zone included.
  size: number;
  // One SVG path covering every dark module, in module units.
  path: string;
};
