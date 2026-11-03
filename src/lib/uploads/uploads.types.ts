/**
 * The upload wire shapes, hand-written from `docs/openapi.json`. Image bytes
 * never pass through our API: a presign names an object and the browser PUTs
 * straight to the bucket.
 *
 * No `server-only`: the caps and the type allowlist are what the browser
 * re-encodes and validates against before it ever asks for a signature.
 */

// One constant per kind of image, matching the backend's `UploadPurpose`, where
// each carries its own authorization rule. Only a group photo exists yet.
export const UPLOAD_PURPOSES = ["GROUP_PHOTO"] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

// The backend's `FieldLimits.IMAGE_BYTES`. It is inside the signature, so the
// bucket refuses an oversized body rather than storing it and complaining after.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Everything the backend will sign for. No SVG, which is a script container
// rather than a photo, and the magic bytes are checked on attach to prove it.
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

export type UploadRequest = {
  purpose: UploadPurpose;
  // What the image is for: a group's uid, for a group photo.
  targetUid: string;
  contentType: ImageType;
  // Exactly what the PUT will send, since the length is signed as well.
  sizeBytes: number;
};

// Nothing is marked `required` in openapi.json, so nothing may be assumed present.
export type UploadResponse = {
  uid?: string;
  uploadUrl?: string;
  expiresInSeconds?: number;
};

export type SignedUrlResponse = {
  url?: string;
  expiresInSeconds?: number;
};

// A presign narrowed to the two fields a caller cannot do without. The URL's own
// lifetime is not among them: the bytes are sent at once, or asked for again.
export type SignedUpload = {
  uid: string;
  uploadUrl: string;
};
