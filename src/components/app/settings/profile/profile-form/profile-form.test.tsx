// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  saved: boolean;
  fieldErrors?: { name?: string; middleName?: string; lastName?: string };
  values?: { name: string; middleName: string; lastName: string };
};

const updateProfileAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null, saved: true }),
);

vi.mock("@/app/(app)/app/settings/profile/actions/actions", () => ({
  updateProfileAction: (previous: unknown, data: FormData) => updateProfileAction(previous, data),
}));

const { putObject, requestUploadAction, resizeImage } = vi.hoisted(() => ({
  putObject: vi.fn(),
  requestUploadAction: vi.fn(),
  resizeImage: vi.fn(),
}));

vi.mock("@/lib/images/resize/resize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/images/resize/resize")>()),
  resizeImage,
}));

vi.mock("@/lib/uploads/put-object/put-object", () => ({
  putObject,
  UPLOAD_FAILED: "That picture could not be sent. Please try again.",
}));

vi.mock("@/app/(app)/uploads/actions/actions", () => ({ requestUploadAction }));

import { ProfileForm } from "@/components/app/settings/profile/profile-form/profile-form";

const BASE = {
  userUid: "u1",
  name: "Ada",
  middleName: "Byron",
  lastName: "Lovelace",
  photoUid: null,
};

const PICKED = new File([new Uint8Array([1, 2])], "me.jpg", { type: "image/jpeg" });
const RESIZED = { size: 48_000, type: "image/webp" } as Blob;

beforeEach(() => {
  updateProfileAction.mockClear();
  updateProfileAction.mockImplementation(async () => ({ error: null, saved: true }));

  URL.createObjectURL = vi.fn(() => "blob:picked");
  URL.revokeObjectURL = vi.fn();
  resizeImage.mockResolvedValue({ ok: true, blob: RESIZED, type: "image/webp" });
  requestUploadAction.mockResolvedValue({
    ok: true,
    uid: "up-2",
    uploadUrl: "https://bucket.test/put",
  });
  putObject.mockResolvedValue(true);
});

function fileInput(): HTMLInputElement {
  const found = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!found) throw new Error("no file input");
  return found;
}

function posted(): FormData | undefined {
  return updateProfileAction.mock.calls[0]?.[1];
}

describe("ProfileForm", () => {
  it("starts from the names the account already has", () => {
    render(<ProfileForm {...BASE} />);

    expect(screen.getByLabelText("First name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Middle name")).toHaveValue("Byron");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lovelace");
  });

  it("posts the uid it already holds, since an omitted one takes the picture away", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ProfileForm {...BASE} photoUid="up-1" />);

    await user.clear(screen.getByLabelText("First name"));
    await user.type(screen.getByLabelText("First name"), "Augusta");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(posted()?.get("name")).toBe("Augusta");
    expect(posted()?.get("photoUid")).toBe("up-1");
    expect(requestUploadAction).not.toHaveBeenCalled();
  });

  it("posts no picture at all once it has been taken away", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ProfileForm {...BASE} photoUid="up-1" />);

    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(posted()?.get("photoUid")).toBeNull();
  });

  it("signs the upload for the reader's own account, never for a group", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ProfileForm {...BASE} />);

    await user.upload(fileInput(), PICKED);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(requestUploadAction).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "USER_PHOTO", targetUid: "u1" }),
    );
    expect(posted()?.get("photoUid")).toBe("up-2");
  });

  it("does not submit a profile with no first name", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ProfileForm {...BASE} />);

    await user.clear(screen.getByLabelText("First name"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateProfileAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
  });
});
