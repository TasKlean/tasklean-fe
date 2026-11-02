// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { IMAGE_TOO_LARGE, resizeImage } from "@/lib/images/resize/resize";

describe("resizeImage", () => {
  it("refuses a file past the cap before trying to decode it", async () => {
    const huge = { size: 26 * 1024 * 1024, type: "image/jpeg" } as Blob;

    await expect(resizeImage(huge)).resolves.toEqual({ ok: false, message: IMAGE_TOO_LARGE });
  });

  it("names the cap in the line it shows", () => {
    expect(IMAGE_TOO_LARGE).toContain("25 MB");
  });
});
