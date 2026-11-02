// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  saved: boolean;
  fieldErrors?: { name?: string; description?: string };
  values?: { name: string; description: string };
};

const updateGroupDetailsAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null, saved: true }),
);

vi.mock("@/app/(app)/app/groups/[uid]/settings/actions/actions", () => ({
  updateGroupDetailsAction: (previous: unknown, data: FormData) =>
    updateGroupDetailsAction(previous, data),
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

import { EditGroupForm } from "@/components/app/group/settings/edit-group-form/edit-group-form";

const BASE = { groupUid: "g1", name: "Flat 4", description: "Ours", photoUid: null };
const PICKED = new File([new Uint8Array([1, 2])], "kitchen.jpg", { type: "image/jpeg" });
const RESIZED = { size: 48_000, type: "image/webp" } as Blob;

beforeEach(() => {
  updateGroupDetailsAction.mockClear();
  updateGroupDetailsAction.mockImplementation(async () => ({ error: null, saved: true }));

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
  return updateGroupDetailsAction.mock.calls[0]?.[1];
}

describe("EditGroupForm", () => {
  it("starts from the details the group already has", () => {
    render(<EditGroupForm {...BASE} />);

    expect(screen.getByLabelText("Group name")).toHaveValue("Flat 4");
    expect(screen.getByLabelText("Description")).toHaveValue("Ours");
  });

  it("posts the group alongside the details", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.clear(screen.getByLabelText("Group name"));
    await user.type(screen.getByLabelText("Group name"), "Flat 5");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(posted()?.get("groupUid")).toBe("g1");
    expect(posted()?.get("name")).toBe("Flat 5");
  });

  it("does not submit a group with no name", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.clear(screen.getByLabelText("Group name"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateGroupDetailsAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name for the group.")).toBeInTheDocument();
  });

  it("says the details were saved", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Group details saved.")).toBeInTheDocument();
  });

  it("takes the success back once the fields are edited again", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Group details saved.");
    await user.type(screen.getByLabelText("Group name"), "!");

    expect(screen.queryByText("Group details saved.")).toBeNull();
  });

  it("reads the picture it already has through our own route", () => {
    render(<EditGroupForm {...BASE} photoUid="up-1" />);

    expect(screen.getByRole("presentation")).toHaveAttribute("src", "/api/image/up-1");
  });

  it("posts the uid it already holds, since an omitted one takes the picture away", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} photoUid="up-1" />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(posted()?.get("photoUid")).toBe("up-1");
    expect(requestUploadAction).not.toHaveBeenCalled();
  });

  it("posts no picture at all once it has been taken away", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} photoUid="up-1" />);

    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(posted()?.get("photoUid")).toBeNull();
  });

  it("sends a picked file and posts the uid it came back as", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} photoUid="up-1" />);

    await user.upload(fileInput(), PICKED);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(putObject).toHaveBeenCalledWith("https://bucket.test/put", RESIZED, "image/webp");
    expect(posted()?.get("photoUid")).toBe("up-2");
  });

  it("saves nothing when the picture could not be sent", async () => {
    putObject.mockResolvedValue(false);
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.upload(fileInput(), PICKED);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateGroupDetailsAction).not.toHaveBeenCalled();
    expect(
      await screen.findByText("That picture could not be sent. Please try again."),
    ).toBeInTheDocument();
  });

  it("reports a refusal above the form", async () => {
    updateGroupDetailsAction.mockImplementation(async () => ({
      error: "Only an admin can do that.",
      saved: false,
    }));
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only an admin can do that.");
  });

  it("shows a field the backend refused, and drops it once that field is edited", async () => {
    updateGroupDetailsAction.mockImplementation(async () => ({
      error: null,
      saved: false,
      fieldErrors: { name: "That name is taken." },
    }));
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("That name is taken.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Group name"), "!");
    expect(screen.queryByText("That name is taken.")).toBeNull();
  });
});
