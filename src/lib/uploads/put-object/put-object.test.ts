import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { putObject } from "@/lib/uploads/put-object/put-object";
import { server } from "@/test/msw";

const URL_SIGNED = "https://bucket.test/group-photo/up-1";
const BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

function blob(): Blob {
  return new Blob([BYTES], { type: "image/webp" });
}

describe("putObject", () => {
  it("puts the bytes under the content type that was signed", async () => {
    let sentType: string | null = null;
    let sentBytes = new Uint8Array();
    server.use(
      http.put(URL_SIGNED, async ({ request }) => {
        sentType = request.headers.get("content-type");
        sentBytes = new Uint8Array(await request.arrayBuffer());
        return new HttpResponse(null, { status: 200, headers: { ETag: '"abc"' } });
      }),
    );

    expect(await putObject(URL_SIGNED, blob(), "image/webp")).toBe(true);
    expect(sentType).toBe("image/webp");
    expect(sentBytes).toEqual(BYTES);
  });

  it("answers false when the bucket refuses the body", async () => {
    server.use(http.put(URL_SIGNED, () => new HttpResponse(null, { status: 403 })));

    expect(await putObject(URL_SIGNED, blob(), "image/webp")).toBe(false);
  });

  it("answers false when the request never gets there", async () => {
    server.use(http.put(URL_SIGNED, () => HttpResponse.error()));

    expect(await putObject(URL_SIGNED, blob(), "image/webp")).toBe(false);
  });
});
