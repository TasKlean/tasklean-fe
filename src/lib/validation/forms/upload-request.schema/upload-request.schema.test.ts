import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES } from "@/lib/uploads/uploads.types";
import { parseUploadRequest } from "@/lib/validation/forms/upload-request.schema/upload-request.schema";

const VALID = {
  purpose: "GROUP_PHOTO",
  targetUid: "g1",
  contentType: "image/webp",
  sizeBytes: 48_000,
};

describe("parseUploadRequest", () => {
  it("takes a measured request for a group photo", () => {
    expect(parseUploadRequest(VALID)).toEqual({ ok: true, values: VALID });
  });

  it("refuses a purpose the backend has no rule for", () => {
    expect(parseUploadRequest({ ...VALID, purpose: "TASK_PHOTO" })).toEqual({
      ok: false,
      errors: { purpose: "Pick what the upload is for." },
    });
  });

  it("refuses a type outside the allowlist, so no SVG is ever signed for", () => {
    expect(parseUploadRequest({ ...VALID, contentType: "image/svg+xml" })).toEqual({
      ok: false,
      errors: { contentType: "Pick a JPEG, PNG or WebP image." },
    });
  });

  it("refuses a body past the cap rather than letting the bucket refuse it", () => {
    expect(parseUploadRequest({ ...VALID, sizeBytes: MAX_IMAGE_BYTES + 1 })).toEqual({
      ok: false,
      errors: { sizeBytes: "Pictures are limited to 5 MB." },
    });
  });

  it("refuses an empty body, which is a signature for nothing", () => {
    expect(parseUploadRequest({ ...VALID, sizeBytes: 0 })).toEqual({
      ok: false,
      errors: { sizeBytes: "That picture is empty." },
    });
  });

  it("refuses a size that is not a whole count of bytes", () => {
    expect(parseUploadRequest({ ...VALID, sizeBytes: "48000" })).toEqual({
      ok: false,
      errors: { sizeBytes: "That picture cannot be measured." },
    });
  });

  it("refuses a request that named nothing to upload for", () => {
    expect(parseUploadRequest({ ...VALID, targetUid: " " })).toEqual({
      ok: false,
      errors: { targetUid: "Pick what the picture is for." },
    });
  });
});
