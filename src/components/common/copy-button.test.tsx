// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CopyButton } from "@/components/common/copy-button";

// Installed after userEvent.setup(), which stubs the clipboard itself.
function clipboard(writeText: (() => Promise<void>) | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

describe("CopyButton", () => {
  it("names what it copies until it is pressed", () => {
    render(<CopyButton value="abcd-2345" label="Copy codes" />);

    expect(screen.getByRole("button", { name: "Copy codes" })).toBeVisible();
  });

  it("writes the value to the clipboard", async () => {
    const writeText = vi.fn(async () => {});
    const user = userEvent.setup({ delay: null });
    clipboard(writeText);

    render(<CopyButton value="abcd-2345" label="Copy codes" />);
    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("abcd-2345");
  });

  it("confirms the copy on the button itself", async () => {
    const user = userEvent.setup({ delay: null });
    clipboard(async () => {});

    render(<CopyButton value="abcd-2345" label="Copy codes" />);
    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Copied" })).toBeVisible();
  });

  it("says so when the clipboard refuses, rather than claiming a copy", async () => {
    const user = userEvent.setup({ delay: null });
    clipboard(async () => {
      throw new Error("denied");
    });

    render(<CopyButton value="abcd-2345" label="Copy codes" />);
    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Could not copy" })).toBeVisible();
  });

  it("survives a browser with no clipboard at all", async () => {
    const user = userEvent.setup({ delay: null });
    clipboard(undefined);

    render(<CopyButton value="abcd-2345" label="Copy codes" />);
    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Could not copy" })).toBeVisible();
  });
});
