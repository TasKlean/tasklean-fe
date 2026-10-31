import { describe, expect, it } from "vitest";
import { isGroupPhotoUrl } from "@/lib/groups/photo/photo";

describe("isGroupPhotoUrl", () => {
  it("takes an https link", () => {
    expect(isGroupPhotoUrl("https://example.test/flat.png")).toBe(true);
  });

  it("refuses plain http, which a secure page would block anyway", () => {
    expect(isGroupPhotoUrl("http://example.test/flat.png")).toBe(false);
  });

  it("refuses a script or a data url", () => {
    expect(isGroupPhotoUrl("javascript:alert(1)")).toBe(false);
    expect(isGroupPhotoUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
  });

  it("refuses anything that is not a url", () => {
    expect(isGroupPhotoUrl("example.test/flat.png")).toBe(false);
    expect(isGroupPhotoUrl("")).toBe(false);
  });

  it("refuses a missing value", () => {
    expect(isGroupPhotoUrl(null)).toBe(false);
    expect(isGroupPhotoUrl(undefined)).toBe(false);
  });
});
