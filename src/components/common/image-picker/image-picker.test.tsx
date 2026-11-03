// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImagePicker } from "@/components/common/image-picker/image-picker";

const FILE = new File([new Uint8Array([1, 2])], "kitchen.jpg", { type: "image/jpeg" });

type Overrides = Partial<Parameters<typeof ImagePicker>[0]>;

function show(overrides: Overrides = {}) {
  const onPick = vi.fn();
  const onRemove = vi.fn();
  const view = render(
    <ImagePicker
      label="Group picture"
      preview={null}
      busy={false}
      failure={null}
      onPick={onPick}
      onRemove={onRemove}
      {...overrides}
    />,
  );

  return { onPick, onRemove, view };
}

function input(): HTMLInputElement {
  const found = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!found) throw new Error("no file input");
  return found;
}

describe("ImagePicker", () => {
  it("hands over the file that was chosen", async () => {
    const { onPick } = show();

    await userEvent.upload(input(), FILE);

    expect(onPick).toHaveBeenCalledWith(FILE);
  });

  it("forgets what was chosen, so the same file can be picked again", async () => {
    show();

    await userEvent.upload(input(), FILE);

    expect(input().value).toBe("");
  });

  it("hands over a file dropped anywhere on the control", () => {
    const { onPick } = show();

    fireEvent.drop(screen.getByRole("group"), { dataTransfer: { files: [FILE] } });

    expect(onPick).toHaveBeenCalledWith(FILE);
  });

  it("offers only choosing while there is no picture", () => {
    show();

    expect(screen.getByRole("button", { name: "Choose photo" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull();
  });

  it("offers replacing and removing once there is one", () => {
    show({ preview: "blob:url-1" });

    expect(screen.getByRole("button", { name: "Replace photo" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Remove photo" })).toBeDefined();
  });

  it("takes the picture away when asked", async () => {
    const { onRemove } = show({ preview: "blob:url-1" });

    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("draws what it was given to preview", () => {
    show({ preview: "/api/image/up-1" });

    expect(screen.getByRole("presentation").getAttribute("src")).toContain("/api/image/up-1");
  });

  it("says what a picture may be, until there is something to report instead", () => {
    const { view } = show();
    expect(screen.getByText(/up to 25 MB/i)).toBeDefined();

    view.rerender(
      <ImagePicker
        label="Group picture"
        preview={null}
        busy={false}
        failure="That file is not an image we can read."
        onPick={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("That file is not an image we can read.")).toBeDefined();
    expect(screen.queryByText(/up to 25 MB/i)).toBeNull();
  });

  it("stops both presses while it is busy", () => {
    show({ preview: "blob:url-1", busy: true });

    expect(screen.getByRole("button", { name: "Replace photo" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Remove photo" })).toHaveProperty("disabled", true);
  });
});
