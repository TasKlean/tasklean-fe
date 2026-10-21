// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const unlinkGoogleAction = vi.fn<(previous: unknown) => Promise<{ error: string | null }>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(app)/app/settings/connected-accounts/actions/actions", () => ({
  unlinkGoogleAction: (previous: unknown) => unlinkGoogleAction(previous),
}));

import { UnlinkGoogle } from "@/components/app/unlink-google/unlink-google";

beforeEach(() => {
  unlinkGoogleAction.mockClear();
});

describe("UnlinkGoogle", () => {
  it("offers nothing to press when Google is the only way in", () => {
    render(<UnlinkGoogle canUnlink={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/Set a password first/)).toBeInTheDocument();
  });

  it("confirms in place before unlinking", async () => {
    const user = userEvent.setup({ delay: null });
    render(<UnlinkGoogle canUnlink />);

    await user.click(screen.getByRole("button", { name: "Unlink" }));

    expect(unlinkGoogleAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Yes, unlink Google" }));

    expect(unlinkGoogleAction).toHaveBeenCalledTimes(1);
  });

  it("goes back to the single button on cancel", async () => {
    const user = userEvent.setup({ delay: null });
    render(<UnlinkGoogle canUnlink />);

    await user.click(screen.getByRole("button", { name: "Unlink" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Unlink" })).toBeInTheDocument();
    expect(unlinkGoogleAction).not.toHaveBeenCalled();
  });
});
