import { describe, expect, it } from "vitest";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";

describe("uploadedImageSrc", () => {
  it("points at our own route rather than at the bucket", () => {
    expect(uploadedImageSrc("up-1")).toBe("/api/image/up-1");
  });

  it("encodes a uid, which goes back out as a path segment", () => {
    expect(uploadedImageSrc("up/1")).toBe("/api/image/up%2F1");
  });

  it("answers with nothing where there is no picture", () => {
    expect(uploadedImageSrc(null)).toBeNull();
    expect(uploadedImageSrc(undefined)).toBeNull();
    expect(uploadedImageSrc("")).toBeNull();
    expect(uploadedImageSrc("   ")).toBeNull();
  });
});
