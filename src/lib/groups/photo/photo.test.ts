import { describe, expect, it } from "vitest";
import { groupPhotoSrc } from "@/lib/groups/photo/photo";

describe("groupPhotoSrc", () => {
  it("points at our own route rather than at the bucket", () => {
    expect(groupPhotoSrc("up-1")).toBe("/api/image/up-1");
  });

  it("encodes a uid, which goes back out as a path segment", () => {
    expect(groupPhotoSrc("up/1")).toBe("/api/image/up%2F1");
  });

  it("answers with nothing for a group that has no picture", () => {
    expect(groupPhotoSrc(null)).toBeNull();
    expect(groupPhotoSrc(undefined)).toBeNull();
    expect(groupPhotoSrc("")).toBeNull();
    expect(groupPhotoSrc("   ")).toBeNull();
  });
});
