/**
 * Shrinks and re-encodes a picked image in the browser. The content type and
 * the exact byte count are both inside an upload's signature, so the bytes have
 * to be final before one is asked for: resize, then presign. Re-encoding every
 * file unconditionally is also what turns an iPhone's HEIC into something the
 * backend will sign for.
 */

import { fitBox } from "@/lib/images/fit-box/fit-box";
import { IMAGE_TYPES, type ImageType } from "@/lib/uploads/uploads.types";

// Enough for the largest place a group photo is drawn, at twice the pixel
// density, and small enough that a phone's photo stops being a megabyte.
const MAX_EDGE = 1024;

const QUALITY = 0.82;

// Decoding is what costs a phone its memory, so an absurd file is refused
// before it is decoded rather than after.
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export const IMAGE_TOO_LARGE = `That image is too large. Pick one under ${MAX_SOURCE_BYTES / 1024 / 1024} MB.`;

export const IMAGE_UNREADABLE = "That file is not an image we can read.";

export type Resized = { ok: true; blob: Blob; type: ImageType } | { ok: false; message: string };

/** Narrows what a canvas actually encoded, which is not always what it was asked for. */
function isImageType(type: string): type is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(type);
}

/** Loads a file far enough to read its size and draw it. */
async function decode(file: Blob): Promise<HTMLImageElement | null> {
  const url = URL.createObjectURL(file);

  try {
    return await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Runs the canvas encoder, which answers through a callback rather than a promise. */
function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Redraws an image at no more than 1024px on its longest edge and encodes it.
 *
 * @returns The bytes to upload and the type they really are, or the line to
 * show the reader. A file we cannot use is an answer rather than a throw,
 * because every case here is one they can fix by picking a different file.
 */
export async function resizeImage(file: Blob): Promise<Resized> {
  if (file.size > MAX_SOURCE_BYTES) return { ok: false, message: IMAGE_TOO_LARGE };

  const image = await decode(file);
  if (!image) return { ok: false, message: IMAGE_UNREADABLE };

  const { width, height } = fitBox(image.naturalWidth, image.naturalHeight, MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return { ok: false, message: IMAGE_UNREADABLE };
  context.drawImage(image, 0, 0, width, height);

  // A canvas with no WebP encoder quietly hands back a PNG, which for a photo
  // is several times the size, so JPEG is asked for rather than accepted.
  const webp = await encode(canvas, "image/webp");
  const blob = webp?.type === "image/webp" ? webp : await encode(canvas, "image/jpeg");

  if (!blob || !isImageType(blob.type)) return { ok: false, message: IMAGE_UNREADABLE };

  return { ok: true, blob, type: blob.type };
}
