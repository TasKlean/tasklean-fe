// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { putObject, requestUploadAction, resizeImage } = vi.hoisted(() => ({
  putObject: vi.fn(),
  requestUploadAction: vi.fn(),
  resizeImage: vi.fn(),
}));

vi.mock("@/lib/images/resize/resize", () => ({ resizeImage }));

vi.mock("@/lib/uploads/put-object/put-object", () => ({
  putObject,
  UPLOAD_FAILED: "That picture could not be sent. Please try again.",
}));

vi.mock("@/app/(app)/uploads/actions/actions", () => ({ requestUploadAction }));

import { useImageUpload } from "@/hooks/use-image-upload/use-image-upload";

const PICKED = { size: 900_000, type: "image/jpeg" } as Blob;
const RESIZED = { size: 48_000, type: "image/webp" } as Blob;
const WEBP = { ok: true, blob: RESIZED, type: "image/webp" } as const;

let revoked: string[] = [];

beforeEach(() => {
  revoked = [];
  let made = 0;
  URL.createObjectURL = vi.fn(() => `blob:url-${(made += 1)}`);
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url);
  });

  resizeImage.mockResolvedValue(WEBP);
  requestUploadAction.mockResolvedValue({
    ok: true,
    uid: "up-1",
    uploadUrl: "https://bucket.test/put?sig=1",
  });
  putObject.mockResolvedValue(true);
});

function Picker() {
  const image = useImageUpload({ purpose: "GROUP_PHOTO", targetUid: "g1" });
  const [uid, setUid] = useState("nothing");

  return (
    <div>
      <button type="button" onClick={() => image.stage(PICKED)}>
        Pick
      </button>
      <button type="button" onClick={image.clear}>
        Remove
      </button>
      <button type="button" onClick={async () => setUid(String(await image.upload()))}>
        Send
      </button>
      <p>preview:{image.preview ?? "none"}</p>
      <p>failure:{image.failure ?? "none"}</p>
      <p>uid:{uid}</p>
    </div>
  );
}

async function pick(label: string) {
  await userEvent.click(screen.getByRole("button", { name: label }));
}

describe("useImageUpload", () => {
  it("resizes what was picked and shows the result rather than the file", async () => {
    render(<Picker />);
    await pick("Pick");

    expect(resizeImage).toHaveBeenCalledWith(PICKED);
    expect(await screen.findByText("preview:blob:url-1")).toBeDefined();
  });

  it("keeps the picture already picked when the next file cannot be read", async () => {
    render(<Picker />);
    await pick("Pick");

    resizeImage.mockResolvedValue({ ok: false, message: "That file is not an image we can read." });
    await pick("Pick");

    expect(await screen.findByText("failure:That file is not an image we can read.")).toBeDefined();
    expect(screen.getByText("preview:blob:url-1")).toBeDefined();
  });

  it("signs for the resized bytes, not the picked ones, and answers with the uid", async () => {
    render(<Picker />);
    await pick("Pick");
    await pick("Send");

    expect(requestUploadAction).toHaveBeenCalledWith({
      purpose: "GROUP_PHOTO",
      targetUid: "g1",
      contentType: "image/webp",
      sizeBytes: 48_000,
    });
    expect(putObject).toHaveBeenCalledWith("https://bucket.test/put?sig=1", RESIZED, "image/webp");
    expect(await screen.findByText("uid:up-1")).toBeDefined();
  });

  it("shows the action's own line when a signature is refused", async () => {
    requestUploadAction.mockResolvedValue({ ok: false, message: "Pictures are limited to 5 MB." });
    render(<Picker />);
    await pick("Pick");
    await pick("Send");

    expect(await screen.findByText("failure:Pictures are limited to 5 MB.")).toBeDefined();
    expect(screen.getByText("uid:null")).toBeDefined();
  });

  it("reports a bucket that would not take the bytes, and attaches nothing", async () => {
    putObject.mockResolvedValue(false);
    render(<Picker />);
    await pick("Pick");
    await pick("Send");

    expect(
      await screen.findByText("failure:That picture could not be sent. Please try again."),
    ).toBeDefined();
    expect(screen.getByText("uid:null")).toBeDefined();
  });

  it("asks for no signature at all when nothing was picked", async () => {
    render(<Picker />);
    await pick("Send");

    expect(requestUploadAction).not.toHaveBeenCalled();
    expect(await screen.findByText("uid:null")).toBeDefined();
  });

  it("lets go of the object URL when the picture is taken away", async () => {
    render(<Picker />);
    await pick("Pick");
    await pick("Remove");

    expect(revoked).toEqual(["blob:url-1"]);
    expect(screen.getByText("preview:none")).toBeDefined();
  });

  it("lets go of the first object URL when a second picture replaces it", async () => {
    render(<Picker />);
    await pick("Pick");
    await pick("Pick");

    expect(revoked).toEqual(["blob:url-1"]);
    expect(await screen.findByText("preview:blob:url-2")).toBeDefined();
  });
});
